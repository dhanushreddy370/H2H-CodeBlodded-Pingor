const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/gmail');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    let query = {};
    if (userId && userId !== 'undefined') {
      query = { $or: [{ userId }, { userId: 'system-sync' }] };
    }

    const threads = await Thread.find(query).sort({ lastUpdated: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive or Trash sync endpoint
router.post('/:id/sync-gmail', async (req, res) => {
  try {
    const { action } = req.body; // 'archive' or 'trash'
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    if (action === 'archive') {
      await gmail.users.threads.modify({
        userId: 'me',
        id: thread.threadId,
        requestBody: { removeLabelIds: ['INBOX'] }
      });
      thread.archived = true;
    } else if (action === 'trash') {
      await gmail.users.threads.trash({
        userId: 'me',
        id: thread.threadId
      });
      thread.trashed = true;
      thread.status = 'ignored';
    }

    await thread.save();
    res.json({ success: true, message: `Email ${action}d in Gmail account.` });
  } catch (err) {
    console.error('Gmail sync error:', err);
    res.status(500).json({ error: 'Failed to sync with Gmail API: ' + err.message });
  }
});

module.exports = router;
