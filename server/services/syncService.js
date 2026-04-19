const cron = require('node-cron');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/gmail');
const Thread = require('../models/Thread');
const SyncLog = require('../models/SyncLog');
const ActionItem = require('../models/ActionItem');
const { classifyThread, extractActionItems, evaluateAcknowledgement, assignPriority } = require('./aiService');
const { createAutoReplyDraft } = require('./gmailService');

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
      // NOTE: For a real persistent service, you may want to load tokens from DB or env here.
      // This assumes oauth2Client has been authenticated somehow in this process.
      throw new Error('OAuth2 credentials are not set. A user must authenticate first.');
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

        // Upsert into MongoDB
        await Thread.findOneAndUpdate(
          { threadId: t.id },
          { 
            subject: subject,
            snippet: snippet,
            categoryTag: categoryTag,
            lastUpdated: new Date(),
            priority: priority,
            sender: fromAddress,
            type: categoryTag
          },
          { upsert: true, new: true }
        );
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
            await ActionItem.findOneAndUpdate(
              { action: a.action, source_email: a.source_email },
              { owner: a.owner, deadline: finalDeadline, status: 'pending', priority: priority, sender: fromAddress, type: categoryTag },
              { upsert: true }
            );
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
    await SyncLog.create({
      status: 'success',
      threadsFetched: threads.length,
      threadsUpserted: upsertedCount,
      durationMs: duration
    });
    
    console.log(`Sync complete: ${upsertedCount} threads upserted in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    await SyncLog.create({
      status: 'failed',
      durationMs: duration,
      error: error.message
    });
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
