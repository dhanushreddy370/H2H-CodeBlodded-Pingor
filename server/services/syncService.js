const cron = require('node-cron');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/gmail');
const Thread = require('../models/Thread');
const Task = require('../models/Task');
const User = require('../models/User');

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
 * Fetches the latest threads from Gmail API and upserts them into MongoDB
 * @returns {Promise<void>}
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

        // Check if thread exists
        const existingThread = await Thread.findOne({ threadId: t.id });
        
        let categoryTag = 'unclassified';
        let priority = 3;
        
        // Only classify if new or snippet changed significantly
        if (!existingThread || existingThread.snippet !== snippet) {
          try {
            categoryTag = await classifyThread(subject, snippet);
            priority = await assignPriority(subject, snippet);
          } catch (aiError) {
            console.error(`AI Classification failed for thread ${t.id}`);
          }
        } else {
          categoryTag = existingThread.categoryTag;
          priority = existingThread.priority;
        }

        const threadData = {
          threadId: t.id,
          subject,
          snippet,
          categoryTag,
          lastUpdated: new Date(),
          priority,
          sender: fromAddress,
          userId
        };

        await Thread.findOneAndUpdate(
          { threadId: t.id },
          { $set: threadData },
          { upsert: true, new: true }
        );
        
        upsertedCount++;

        // Process Action Items
        if (categoryTag === 'action-required') {
          const actions = await extractActionItems(t.id, subject, snippet);
          for (const a of actions) {
            let finalDeadline = null;
            if (a.deadline && a.deadline.toLowerCase() !== 'none') {
              const d = new Date(a.deadline);
              if (!isNaN(d.valueOf())) finalDeadline = d;
            }
            
            await Task.findOneAndUpdate(
              { userId, action: a.action, threadId: t.id },
              { 
                $set: { 
                  deadline: finalDeadline,
                  priority,
                  sender: fromAddress,
                  updatedAt: new Date()
                }
              },
              { upsert: true }
            );
          }
        } else if (categoryTag === 'FYI/informational') {
          const evalRes = await evaluateAcknowledgement(subject, snippet);
          if (evalRes && evalRes.isInformational && evalRes.draftReply) {
            await Thread.updateOne(
              { threadId: t.id },
              { 
                $set: { 
                  aiResponse: evalRes.draftReply,
                  draftStatus: 'pending_approval' 
                } 
              }
            );
          }
        }
      } catch (err) {
        console.error(`Error processing thread ${t.id}:`, err.message);
      } finally {
        currentSyncStatus.processedThreads++;
      }
    }

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
