const cron = require('node-cron');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/gmail');
const { readDB, writeDB } = require('./dbService');
const { classifyThread, extractActionItems, evaluateAcknowledgement, assignPriority } = require('./aiService');
const { createAutoReplyDraft } = require('./gmailService');
const { v4: uuidv4 } = require('uuid');

/**
 * Fetches the latest threads from Gmail API and upserts them into MongoDB
 * @returns {Promise<void>}
 */
const syncThreads = async () => {
  const startTime = Date.now();
  console.log('Starting thread sync heartbeat...');
  
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
      return;
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Fetch latest 50-100 threads (using 100 as the max page size here)
    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults: 100,
    });

    const threads = response.data.threads || [];
    let upsertedCount = 0;

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
          type: categoryTag
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
              type: categoryTag
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
            // Create a draft
            const draftCreated = await createAutoReplyDraft(t.id, fromAddress, subject, evalRes.draftReply);
            
            if (draftCreated) {
              // Alert user in console
              console.log(`\n[ALERT] A new FYI email was received.`);
              console.log(`From: ${fromAddress}`);
              console.log(`Subject: ${subject}`);
              console.log(`I am going to respond in the following way:`);
              console.log(`${evalRes.draftReply}\n`);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing thread ${t.id}:`, err.message);
        // Continue with the next thread despite an error
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
  initHeartbeat
};
