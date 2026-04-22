const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { createAutoReplyDraft } = require('../services/gmailService');

// Get all follow-ups
router.get('/', (req, res) => {
  try {
    const { priority, userId } = req.query;
    const db = readDB();
    const threads = db.threads || [];
    
    // Core filter: All informational emails OR emails that have a generated draft
    let filtered = threads.filter(t => 
      t.categoryTag === 'FYI/informational' || (t.draftStatus && t.draftStatus !== 'none')
    );
    
    if (userId && userId !== 'undefined') {
      filtered = filtered.filter(t => t.userId === userId || t.userId === 'system-sync');
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || a.createdAt);
      const dateB = new Date(b.lastUpdated || b.createdAt);
      
      if (priority === 'asc') return (a.priority || 3) - (b.priority || 3);
      if (priority === 'desc') return (b.priority || 3) - (a.priority || 3);
      
      return dateB - dateA;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get count of pending drafts
router.get('/draft-count', (req, res) => {
  try {
    const { userId } = req.query;
    const db = readDB();
    const threads = db.threads || [];
    
    const count = threads.filter(t => 
      t.draftStatus === 'pending_approval' && 
      t.status !== 'done' &&
      (!userId || userId === 'undefined' || t.userId === userId)
    ).length;
    
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update thread status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const db = readDB();
    const index = (db.threads || []).findIndex(t => t._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Thread not found' });
    
    db.threads[index].status = status;
    db.threads[index].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    res.json(db.threads[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the draft content
router.patch('/edit/:id', (req, res) => {
  try {
    const { aiResponse } = req.body;
    const db = readDB();
    const index = (db.threads || []).findIndex(t => t._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Thread not found' });
    
    db.threads[index].aiResponse = aiResponse;
    db.threads[index].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    res.json(db.threads[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve and push draft to Gmail
router.post('/approve/:id', async (req, res) => {
  try {
    const db = readDB();
    const index = (db.threads || []).findIndex(t => t._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Thread not found' });
    const thread = db.threads[index];
    
    if (!thread.aiResponse) return res.status(400).json({ error: 'No draft content found' });

    // Push to Gmail API
    const draftCreated = await createAutoReplyDraft(
      thread.userId,
      thread.threadId, 
      thread.sender, 
      thread.subject, 
      thread.aiResponse
    );

    if (draftCreated) {
      db.threads[index].draftStatus = 'approved';
      db.threads[index].status = 'done';
      db.threads[index].updatedAt = new Date().toISOString();
      await writeDB(db);
      res.json({ success: true, thread: db.threads[index] });
    } else {
      res.status(500).json({ error: 'Failed to create draft in Gmail' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject and discard draft
router.post('/reject/:id', (req, res) => {
  try {
    const db = readDB();
    const index = (db.threads || []).findIndex(t => t._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Thread not found' });
    
    db.threads[index].draftStatus = 'rejected';
    db.threads[index].handledByAI = false;
    db.threads[index].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    res.json({ success: true, thread: db.threads[index] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
