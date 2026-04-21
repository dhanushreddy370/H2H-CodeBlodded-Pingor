const cron = require('node-cron');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/gmail');
const { readDB, writeDB } = require('./dbService');
const { classifyThread, extractActionItems, evaluateAcknowledgement, assignPriority } = require('./aiService');
const { createAutoReplyDraft } = require('./gmailService');
const { v4: uuidv4 } = require('uuid');

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
  console.log('Starting thread sync heartbeat...');
  
  currentSyncStatus = {
    inProgress: true,
    totalThreads: 0,
    processedThreads: 0,
    lastError: null,
    lastSyncTime: new Date().toISOString()
  };
  
  try {
    // If there's no auth credential, we skip or error out
    if (!oauth2Client.credentials || Object.keys(oauth2Client.credentials).length === 0) {
      console.warn('⚠️ OAuth2 credentials missing. Running in DEV/OFFLINE mode with local database.');
      // Process existing threads in DB to demonstrate AI agents
      const db = readDB();
      const threads = db.threads;
      let processedCount = 0;
      
      for (const t of threads) {
        if (!t.aiProcessed) {
          try {
            console.log(`[DEV MODE] Processing local thread: ${t.subject}`);
            const categoryTag = await classifyThread(t.subject, t.snippet);
            const priority = await assignPriority(t.subject, t.snippet);
            
            const idx = db.threads.findIndex(th => th._id === t._id);
            db.threads[idx] = { 
              ...db.threads[idx], 
              categoryTag, 
              priority, 
              type: categoryTag,
              aiProcessed: true,
              lastUpdated: new Date().toISOString() 
            };

            // Specialized action item extraction
            if (categoryTag === 'action-required') {
              const actions = await extractActionItems(t._id, t.subject, t.snippet);
              for (const a of actions) {
                const actionData = {
                  _id: uuidv4(),
                  action: a.action,
                  threadId: t._id,
                  owner: a.owner || 'user',
                  deadline: a.deadline !== 'none' ? a.deadline : null,
                  status: 'pending',
                  priority,
                  sender: t.sender,
                  type: categoryTag,
                  createdAt: new Date().toISOString(),
                  userId: t.userId || 'test-user-id'
                };
                db.actionItems.push(actionData);
              }
            }
            processedCount++;
          } catch (aiErr) {
            console.error(`AI failure for local thread ${t._id}:`, aiErr.message);
          }
        }
      }
      
      writeDB(db);
      console.log(`[DEV MODE] Sync finish. Processed ${processedCount} threads with AI.`);
      currentSyncStatus.inProgress = false;
      currentSyncStatus.processedThreads = processedCount;
      currentSyncStatus.totalThreads = processedCount;
      isSyncing = false;
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Fetch latest 25 threads (reduced from 100 to avoid unnecessary processing)
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
        // Fetch full thread details to get subject and snippet
        const threadDetails = await gmail.users.threads.get({
          userId: 'me',
          id: t.id,
        });

        const snippet = threadDetails.data.snippet;
        const messages = threadDetails.data.messages || [];
        const firstMessage = messages[0];
        const headers = firstMessage?.payload?.headers || [];
        const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
        const subject = subjectHeader ? subjectHeader.value : '(No Subject)';
        const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
        const fromAddress = fromHeader ? fromHeader.value : 'Unknown';

        // Pass to AI Service for classification
        let categoryTag = 'unclassified';
        let priority = 3;
        try {
          categoryTag = await classifyThread(subject, snippet);
          priority = await assignPriority(subject, snippet);
        } catch (aiError) {
          console.error(`AI Classification failed for thread ${t.id}, marking as unclassified/priority 3.`);
          // System continues to sync the email as 'unclassified'
        }

        // Upsert into JSON DB
        const db = readDB();
        const threadIndex = db.threads.findIndex(th => th.threadId === t.id);
        const threadData = {
          threadId: t.id,
          subject: subject,
          snippet: snippet,
          categoryTag: categoryTag,
          lastUpdated: new Date().toISOString(),
          priority: priority,
          sender: fromAddress,
          type: categoryTag,
          userId: userId
        };

        if (threadIndex > -1) {
          db.threads[threadIndex] = { ...db.threads[threadIndex], ...threadData };
        } else {
          db.threads.push({ _id: uuidv4(), ...threadData, createdAt: new Date().toISOString() });
        }
        writeDB(db);
        
        upsertedCount++;

        // Post-classification specialized logic
        if (categoryTag === 'action-required') {
          const actions = await extractActionItems(t.id, subject, snippet);
          for (const a of actions) {
            let finalDeadline = null;
            if (a.deadline && a.deadline.toLowerCase() !== 'none') {
              const d = new Date(a.deadline);
              if (!isNaN(d.valueOf())) finalDeadline = d;
            }
            
            const db = readDB();
            const actionIndex = db.actionItems.findIndex(ai => ai.action === a.action && ai.source_email === a.source_email);
            const actionData = {
              action: a.action,
              source_email: a.source_email,
              owner: a.owner,
              deadline: finalDeadline ? finalDeadline.toISOString() : null,
              status: 'pending',
              priority: priority,
              sender: fromAddress,
              type: categoryTag,
              userId: userId
            };
            
            if (actionIndex > -1) {
              db.actionItems[actionIndex] = { ...db.actionItems[actionIndex], ...actionData, updatedAt: new Date().toISOString() };
            } else {
              db.actionItems.push({ _id: uuidv4(), ...actionData, createdAt: new Date().toISOString() });
            }
            writeDB(db);
          }
        } else if (categoryTag === 'FYI/informational') {
          const evalRes = await evaluateAcknowledgement(subject, snippet);
          if (evalRes && evalRes.isInformational && evalRes.draftReply) {
            // STOP: We no longer auto-create drafts in Gmail. 
            // We store them locally for user review first.
            
            const tdb = readDB();
            const tIdx = tdb.threads.findIndex(th => th.threadId === t.id);
            if (tIdx > -1) {
              tdb.threads[tIdx].aiResponse = evalRes.draftReply;
              tdb.threads[tIdx].handledByAI = true;
              tdb.threads[tIdx].draftStatus = 'pending_approval';
              writeDB(tdb);
              
              console.log(`\n[AI SUGGESTION] New draft cached for review.`);
              console.log(`From: ${fromAddress}`);
              console.log(`Subject: ${subject}`);
              console.log(`Review here: http://localhost:3000/follow-ups\n`);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing thread ${t.id}:`, err.message);
        // Continue with the next thread despite an error
      } finally {
        currentSyncStatus.processedThreads++;
      }
    }

    const duration = Date.now() - startTime;
    const db = readDB();
    db.syncLogs.push({
      _id: uuidv4(),
      status: 'success',
      threadsFetched: threads.length,
      threadsUpserted: upsertedCount,
      durationMs: duration,
      executionTime: new Date().toISOString()
    });
    writeDB(db);
    
    console.log(`Sync complete: ${upsertedCount} threads upserted in ${duration}ms`);
    currentSyncStatus.inProgress = false;
    isSyncing = false;
  } catch (error) {
    const duration = Date.now() - startTime;
    const db = readDB();
    db.syncLogs.push({
      _id: uuidv4(),
      status: 'failed',
      durationMs: duration,
      error: error.message,
      executionTime: new Date().toISOString()
    });
    writeDB(db);
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
