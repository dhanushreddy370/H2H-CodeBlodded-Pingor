const cron = require('node-cron');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/gmail');
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
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Fetch latest 25 threads
    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults: 25,
    });

    const threads = response.data.threads || [];
    let upsertedCount = 0;

    currentSyncStatus.totalThreads = threads.length;
    currentSyncStatus.processedThreads = 0;

    // Load initial DB
    const db = readDB();
    if (!db.threads) db.threads = [];
    if (!db.actionItems) db.actionItems = [];

    for (const t of threads) {
      try {
        // Fetch full thread details
        const threadDetails = await gmail.users.threads.get({
          userId: 'me',
          id: t.id,
        });

        const snippet = threadDetails.data.snippet;
        const messages = threadDetails.data.messages || [];
        const firstMessage = messages[0];
        const headers = firstMessage?.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const fromAddress = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';

        // Check if thread exists in local DB
        const threadIndex = db.threads.findIndex(item => item.threadId === t.id);
        const existingThread = threadIndex !== -1 ? db.threads[threadIndex] : null;
        
        let categoryTag = 'unclassified';
        let priority = 3;
        
        // Only classify if new or snippet changed significantly
        if (!existingThread || existingThread.snippet !== snippet) {
          try {
            categoryTag = await aiService.classifyThread(subject, snippet);
            priority = await aiService.assignPriority(subject, snippet);
          } catch (aiError) {
            console.error(`AI Classification failed for thread ${t.id}`);
          }
        } else {
          categoryTag = existingThread.categoryTag;
          priority = existingThread.priority;
        }

        const threadData = {
          _id: existingThread?._id || `thread-${t.id}`,
          threadId: t.id,
          subject,
          snippet,
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
        
        upsertedCount++;

        // Process Action Items
        if (categoryTag === 'action-required') {
          const actions = await aiService.extractActionItems(t.id, subject, snippet);
          for (const a of actions) {
            let finalDeadline = null;
            if (a.deadline && a.deadline.toLowerCase() !== 'none') {
              const d = new Date(a.deadline);
              if (!isNaN(d.valueOf())) finalDeadline = d.toISOString().split('T')[0];
            }
            
            const taskIndex = db.actionItems.findIndex(item => item.threadId === t.id && item.action === a.action);
            const taskData = {
              _id: taskIndex !== -1 ? db.actionItems[taskIndex]._id : `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              userId,
              action: a.action,
              threadId: t.id,
              deadline: finalDeadline,
              priority,
              sender: fromAddress,
              status: taskIndex !== -1 ? db.actionItems[taskIndex].status : 'pending',
              updatedAt: new Date().toISOString()
            };

            if (taskIndex !== -1) {
              db.actionItems[taskIndex] = taskData;
            } else {
              db.actionItems.push(taskData);
            }
          }
        } else if (categoryTag === 'FYI/informational') {
          const evalRes = await aiService.evaluateAcknowledgement(subject, snippet);
          if (evalRes && evalRes.isInformational && evalRes.draftReply) {
             const idx = db.threads.findIndex(item => item.threadId === t.id);
             if (idx !== -1) {
               db.threads[idx].aiResponse = evalRes.draftReply;
               db.threads[idx].draftStatus = 'pending_approval';
             }
          }
        }
      } catch (err) {
        console.error(`Error processing thread ${t.id}:`, err.message);
      } finally {
        currentSyncStatus.processedThreads++;
      }
    }

    // Save final DB state
    writeDB(db);

    const duration = Date.now() - startTime;
    console.log(`Sync complete: ${upsertedCount} threads processed in ${duration}ms`);
    currentSyncStatus.inProgress = false;
    isSyncing = false;
  } catch (error) {
    console.error('Heartbeat Sync Error:', error.message);
    currentSyncStatus.inProgress = false;
    currentSyncStatus.lastError = error.message;
    isSyncing = false;
  }
};

/**
 * Initializes the Node-Cron heartbeat job
 */
const initHeartbeat = () => {
  // Triggers every hour at minute 0
  cron.schedule('0 * * * *', () => {
    syncThreads();
  });
  console.log('Heartbeat cron job initialized.');
};

module.exports = {
  syncThreads,
  initHeartbeat,
  getSyncProgress
};
