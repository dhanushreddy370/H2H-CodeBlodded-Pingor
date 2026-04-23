const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { createAutoReplyDraft } = require('../services/gmailService');

const MANUAL_FOLLOWUP_TAG = 'manual-followup';

const normalizeFollowUp = (payload = {}, existing = {}) => {
  const nextSubject = payload.subject || payload.action || existing.subject || existing.action || 'Untitled Follow-up';
  const nextSnippet = payload.snippet ?? payload.description ?? existing.snippet ?? existing.description ?? '';
  const parsedPriority = Number(payload.priority);

  return {
    ...existing,
    ...payload,
    subject: nextSubject,
    action: payload.action || nextSubject,
    description: payload.description ?? existing.description ?? nextSnippet,
    snippet: nextSnippet,
    content: payload.content ?? payload.description ?? existing.content ?? nextSnippet,
    sender: payload.sender || existing.sender || 'Manual Entry',
    priority: Number.isFinite(parsedPriority) ? parsedPriority : (existing.priority || 3),
    categoryTag: payload.categoryTag || existing.categoryTag || MANUAL_FOLLOWUP_TAG,
    draftStatus: payload.draftStatus || existing.draftStatus || 'none',
    status: payload.status || existing.status || 'open',
    assignees: Array.isArray(payload.assignees) ? payload.assignees : (existing.assignees || []),
    comments: Array.isArray(payload.comments) ? payload.comments : (existing.comments || []),
    attachments: Array.isArray(payload.attachments) ? payload.attachments : (existing.attachments || []),
    threadId: payload.threadId ?? existing.threadId ?? null
  };
};

// Get all follow-ups
router.get('/', (req, res) => {
  try {
    const { priority, userId, status } = req.query;
    const db = readDB();
    const threads = db.threads || [];
    
    // Core filter: All informational emails OR emails that have a generated draft
    let filtered = threads.filter(t => 
      t.categoryTag === 'FYI/informational' ||
      t.categoryTag === MANUAL_FOLLOWUP_TAG ||
      (t.draftStatus && t.draftStatus !== 'none')
    );
    
    if (userId && userId !== 'undefined') {
      filtered = filtered.filter(t => t.userId === userId || t.userId === 'system-sync');
    }

    if (status) {
      filtered = filtered.filter(t => t.status === status);
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

router.post('/', async (req, res) => {
  try {
    const db = readDB();
    if (!db.threads) db.threads = [];

    const newThread = normalizeFollowUp(req.body, {
      _id: `thread-manual-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    db.threads.push(newThread);
    await writeDB(db);
    res.status(201).json(newThread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const db = readDB();
    const index = (db.threads || []).findIndex(t => t._id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Thread not found' });

    db.threads[index] = normalizeFollowUp(req.body, {
      ...db.threads[index],
      updatedAt: new Date().toISOString()
    });

    await writeDB(db);
    res.json(db.threads[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update thread status
router.patch('/:id/status', async (req, res) => {
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
router.patch('/edit/:id', async (req, res) => {
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
router.post('/reject/:id', async (req, res) => {
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
