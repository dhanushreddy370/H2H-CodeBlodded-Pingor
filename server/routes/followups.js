const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { createAutoReplyDraft } = require('../services/gmailService');
router.get('/', async (req, res) => {
  try {
    const { priority, status, type, sender, timeSinceReply, userId } = req.query;
    const db = readDB();
    
    let filtered = db.threads;
    
    if (userId && userId !== 'undefined') {
      filtered = filtered.filter(t => t.userId === userId || t.userId === "test-user-id");
    } else {
      filtered = filtered.filter(t => t.userId === "test-user-id" || !t.userId);
    }
    if (status) filtered = filtered.filter(t => t.status === status);
    if (type) filtered = filtered.filter(t => t.type === type);
    if (sender) {
      const senderRegex = new RegExp(sender, 'i');
      filtered = filtered.filter(t => senderRegex.test(t.sender));
    }
    
    filtered.sort((a, b) => {
      let dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      let dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      let diff = dateB - dateA;
      
      if (priority === 'asc') diff = (a.priority || 3) - (b.priority || 3);
      if (priority === 'desc') diff = (b.priority || 3) - (a.priority || 3);
      if (timeSinceReply === 'asc') diff = dateB - dateA;
      if (timeSinceReply === 'desc') diff = dateA - dateB;

      return diff;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get count of pending drafts
router.get('/draft-count', async (req, res) => {
  try {
    const { userId } = req.query;
    const db = readDB();
    
    let filtered = db.threads;
    if (userId && userId !== 'undefined') {
      filtered = filtered.filter(t => t.userId === userId || t.userId === "test-user-id");
    }
    
    const count = filtered.filter(t => t.draftStatus === 'pending_approval' && t.status !== 'done').length;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update thread
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const db = readDB();
    const tIndex = db.threads.findIndex(t => t._id === req.params.id);
    
    if (tIndex === -1) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    db.threads[tIndex].status = status;
    db.threads[tIndex].updatedAt = new Date().toISOString();
    writeDB(db);
    
    res.json(db.threads[tIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the draft content (before approval)
router.patch('/:id/draft', async (req, res) => {
  try {
    const { draftText } = req.body;
    const db = readDB();
    const tIndex = db.threads.findIndex(t => t._id === req.params.id);
    
    if (tIndex === -1) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    db.threads[tIndex].aiResponse = draftText;
    db.threads[tIndex].updatedAt = new Date().toISOString();
    writeDB(db);
    
    res.json(db.threads[tIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve and push the draft to Gmail
router.post('/:id/approve-draft', async (req, res) => {
  try {
    const db = readDB();
    const tIndex = db.threads.findIndex(t => t._id === req.params.id);
    
    if (tIndex === -1) return res.status(404).json({ error: 'Thread not found' });
    
    const thread = db.threads[tIndex];
    if (!thread.aiResponse) return res.status(400).json({ error: 'No draft content found' });

    // Actually create the draft in Gmail
    const draftCreated = await createAutoReplyDraft(
      thread.threadId, 
      thread.sender, 
      thread.subject, 
      thread.aiResponse
    );

    if (draftCreated) {
      db.threads[tIndex].draftStatus = 'approved';
      db.threads[tIndex].status = 'done'; // Automatically close as handled
      db.threads[tIndex].updatedAt = new Date().toISOString();
      writeDB(db);
      res.json({ success: true, message: 'Draft pushed to Gmail and status updated' });
    } else {
      res.status(500).json({ error: 'Failed to create draft in Gmail' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject and discard the suggested draft
router.post('/:id/reject-draft', async (req, res) => {
  try {
    const db = readDB();
    const tIndex = db.threads.findIndex(t => t._id === req.params.id);
    
    if (tIndex === -1) return res.status(404).json({ error: 'Thread not found' });
    
    db.threads[tIndex].draftStatus = 'rejected';
    db.threads[tIndex].handledByAI = false; // Mark as unhandled so user can handle manually
    db.threads[tIndex].updatedAt = new Date().toISOString();
    writeDB(db);
    
    res.json({ success: true, message: 'AI suggestion discarded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
