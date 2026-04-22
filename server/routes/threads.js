const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { google } = require('googleapis');
const { getClientForUser } = require('../config/gmail');

router.get('/', (req, res) => {
  try {
    const { userId } = req.query;
    const db = readDB();
    const threads = db.threads || [];
    
    let filtered = threads;
    if (userId && userId !== 'undefined') {
      filtered = threads.filter(t => t.userId === userId || t.userId === 'system-sync');
    }

    filtered.sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive or Trash sync endpoint
router.post('/:id/sync-gmail', async (req, res) => {
  try {
    const { action } = req.body; // 'archive' or 'trash'
    const db = readDB();
    const index = (db.threads || []).findIndex(t => t._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Thread not found' });
    const thread = db.threads[index];

    const client = getClientForUser(thread.userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    if (action === 'archive') {
      await gmail.users.threads.modify({
        userId: 'me',
        id: thread.threadId,
        requestBody: { removeLabelIds: ['INBOX'] }
      });
      db.threads[index].archived = true;
    } else if (action === 'trash') {
      await gmail.users.threads.trash({
        userId: 'me',
        id: thread.threadId
      });
      db.threads[index].trashed = true;
      db.threads[index].status = 'ignored';
    }

    db.threads[index].updatedAt = new Date().toISOString();
    writeDB(db);
    
    res.json({ success: true, message: `Email ${action}d in Gmail account.` });
  } catch (err) {
    console.error('Gmail sync error:', err);
    res.status(500).json({ error: 'Failed to sync with Gmail API: ' + err.message });
  }
});

module.exports = router;
