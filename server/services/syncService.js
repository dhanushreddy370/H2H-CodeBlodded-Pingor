const cron = require('node-cron');
const { google } = require('googleapis');
const { getClientForUser } = require('../utils/googleClient');
const { readDB, writeDB } = require('./dbService');
const aiService = require('./aiService');

let isSyncing = false;

let currentSyncStatus = {
  inProgress: false,
  totalThreads: 0,
  processedThreads: 0,
  lastError: null,
  lastSyncTime: null
};

/**
 * Extracts full body content from a Gmail message payload
 */
const extractBody = (payload) => {
  if (!payload) return '';
  
  // 1. If body data exists at top level
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  
  // 2. If it has parts (multipart message)
  if (payload.parts && payload.parts.length > 0) {
    // Try to find text/html or text/plain
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
    const plainPart = payload.parts.find(p => p.mimeType === 'text/plain');
    const targetPart = htmlPart || plainPart || payload.parts[0];
    
    if (targetPart.body && targetPart.body.data) {
      return Buffer.from(targetPart.body.data, 'base64').toString('utf8');
    }
    
    // Recursive search in sub-parts
    if (targetPart.parts) {
      return extractBody(targetPart);
    }
  }
  
  return '';
};

/**
 * Gets the current sync progress
 */
const getSyncProgress = () => currentSyncStatus;

/**
 * Fetches the latest threads from Gmail API and upserts them into JSON DB
 */
const syncThreads = async (userId = 'system-sync') => {
  if (isSyncing) {
    console.log('Sync already in progress. Skipping...');
    return;
  }
  
  isSyncing = true;
  const startTime = Date.now();
  console.log(`Starting thread sync heartbeat for userId: ${userId}...`);
  
  currentSyncStatus = {
    inProgress: true,
    totalThreads: 0,
    processedThreads: 0,
    lastError: null,
    lastSyncTime: new Date().toISOString()
  };
  
  try {
    const client = getClientForUser(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });
    
    // Fetch latest 75 thread IDs
    const listResponse = await gmail.users.threads.list({
      userId: 'me',
      maxResults: 75,
    });

    const threadList = listResponse.data.threads || [];
    currentSyncStatus.totalThreads = threadList.length;
    currentSyncStatus.processedThreads = 0;

    const db = readDB();
    if (!db.threads) db.threads = [];
    if (!db.actionItems) db.actionItems = [];

    // --- PIPELINE 1: RETRIEVAL ---
    // We fetch raw metadata for all threads in parallel (fast)
    console.log(`[PIPELINE] Retrieval started for ${threadList.length} threads...`);
    const rawDataQueue = [];
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < threadList.length; i += BATCH_SIZE) {
      const batch = threadList.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (t) => {
        try {
          const details = await gmail.users.threads.get({ userId: 'me', id: t.id });
          return details.data;
        } catch (e) {
          console.error(`Fetch failed for ${t.id}:`, e.message);
          return null;
        }
      }));
      rawDataQueue.push(...batchResults.filter(r => r !== null));
    }
    console.log(`[PIPELINE] Retrieval complete. ${rawDataQueue.length} items in processing queue.`);

    // --- PIPELINE 2: PROCESSING (Worker Pool) ---
    // We process threads with AI in parallel batches to optimize speed vs local LLM load
    const CONCURRENCY = 3; // Limit AI calls to avoid overloading local Ollama
    let processedCount = 0;

    const worker = async (threadDetail) => {
      try {
        const id = threadDetail.id;
        const snippet = threadDetail.snippet;
        const messages = threadDetail.messages || [];
        const firstMessage = messages[0];
        const headers = firstMessage?.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const fromAddress = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';

        const threadIndex = db.threads.findIndex(item => item.threadId === id);
        const existingThread = threadIndex !== -1 ? db.threads[threadIndex] : null;
        
        let categoryTag = 'unclassified';
        let priority = 3;
        
        const fullContent = extractBody(firstMessage?.payload);
        let aiSummary = existingThread?.aiSummary || '';
        
        if (!existingThread || existingThread.snippet !== snippet) {
          try {
            categoryTag = await aiService.classifyThread(subject, snippet);
            priority = await aiService.assignPriority(subject, snippet);
            aiSummary = await aiService.generateInsight(subject, snippet);
          } catch (aiError) {
            console.error(`AI Analysis failed for ${id}:`, aiError.message);
          }
        } else {
          categoryTag = existingThread.categoryTag;
          priority = existingThread.priority;
          aiSummary = existingThread.aiSummary;
        }

        const threadData = {
          _id: existingThread?._id || `thread-${id}`,
          threadId: id,
          subject,
          snippet,
          content: fullContent || snippet,
          aiSummary,
          categoryTag,
          lastUpdated: new Date().toISOString(),
          priority,
          sender: fromAddress,
          userId,
          status: existingThread?.status || 'open'
        };

        if (threadIndex !== -1) {
          db.threads[threadIndex] = { ...db.threads[threadIndex], ...threadData };
        } else {
          db.threads.push(threadData);
        }

        // Action Item Extraction
        if (categoryTag === 'action-required') {
          try {
            const actions = await aiService.extractActionItems(id, subject, snippet);
            for (const a of actions) {
              const taskIndex = db.actionItems.findIndex(item => item.threadId === id && item.action === a.action);
              const taskData = {
                _id: taskIndex !== -1 ? db.actionItems[taskIndex]._id : `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                userId,
                action: a.action,
                threadId: id,
                deadline: a.deadline && a.deadline !== 'none' ? a.deadline : null,
                priority,
                sender: fromAddress,
                status: taskIndex !== -1 ? db.actionItems[taskIndex].status : 'pending',
                updatedAt: new Date().toISOString()
              };
              if (taskIndex !== -1) db.actionItems[taskIndex] = taskData;
              else db.actionItems.push(taskData);
            }
          } catch (e) { /* silent */ }
        }

        processedCount++;
        currentSyncStatus.processedThreads = processedCount;

        // Periodic Save (Every 5 processed items)
        if (processedCount % 5 === 0) {
          await writeDB(db);
          console.log(`[PIPELINE] Checkpoint: ${processedCount}/${rawDataQueue.length} processed.`);
        }

      } catch (err) {
        console.error(`Worker failed for thread:`, err.message);
      }
    };

    // Run processing pool
    for (let i = 0; i < rawDataQueue.length; i += CONCURRENCY) {
      const batch = rawDataQueue.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(item => worker(item)));
    }

    // Final Save
    await writeDB(db);
    console.log(`[SYNC] Pipeline finished. ${processedCount} threads finalized.`);
    currentSyncStatus.inProgress = false;
    isSyncing = false;
  } catch (error) {
    console.error('Heartbeat Sync Error:', error.message);
    currentSyncStatus.inProgress = false;
    currentSyncStatus.lastError = error.message;
    isSyncing = false;
  }
};

let syncJob;

/**
 * Initializes the Node-Cron heartbeat job with dynamic frequency.
 */
const initHeartbeat = () => {
  const db = readDB();
  // Check for global or user-specific sync frequency (default to 10 mins)
  // We'll use the setting from the first user for simplicity in this version
  const firstUser = db.users?.find(u => u.settings?.syncFrequency);
  const rawFrequency = firstUser?.settings?.syncFrequency;
  const isManualMode = rawFrequency === 'manual';
  const parsedFrequency = Number(rawFrequency);
  const frequency = Number.isInteger(parsedFrequency) && parsedFrequency > 0 ? parsedFrequency : 10;
  
  if (syncJob) {
    syncJob.stop();
    syncJob = null;
    console.log('Stopping existing sync job...');
  }

  if (isManualMode) {
    triggerAllSyncs().catch(err => console.error('Initial sync failed:', err.message));
    console.log('Heartbeat cron job paused (manual sync mode).');
    return;
  }

  // Triggers every X minutes
  syncJob = cron.schedule(`*/${frequency} * * * *`, async () => {
    console.log(`Heartbeat: Triggering sync for all connected users (every ${frequency}m)...`);
    await triggerAllSyncs();
  });

  // Run immediately on server start to ensure fresh data
  triggerAllSyncs().catch(err => console.error('Initial sync failed:', err.message));
  
  console.log(`Heartbeat cron job initialized (${frequency}min interval).`);
};

const triggerAllSyncs = async () => {
  const db = readDB();
  const usersWithGmail = (db.users || []).filter(u => u.gmailConnected && u.tokens);
  
  for (const user of usersWithGmail) {
    try {
      // Run sync in background (no await)
      syncThreads(user.id || user.sub || user.email).catch(e => {
        console.error(`Background sync error for ${user.email}:`, e.message);
      });
    } catch (err) {
      console.error(`Heartbeat sync failed for user ${user.email}:`, err.message);
    }
  }
};

module.exports = {
  syncThreads,
  initHeartbeat,
  getSyncProgress
};
