const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');

router.get('/', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const db = readDB();
    const sessions = (db.chatSessions || [])
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map(s => ({
        _id: s._id,
        title: s.title,
        updatedAt: s.updatedAt
      }));
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = readDB();
    const session = (db.chatSessions || []).find(s => s._id === req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, title, initialMessage } = req.body;
    const db = readDB();
    if (!db.chatSessions) db.chatSessions = [];

    const newSession = {
      _id: `chat-${Date.now()}`,
      userId,
      title: title || 'New Conversation',
      messages: initialMessage ? [initialMessage] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.chatSessions.push(newSession);
    await writeDB(db);
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { role, content } = req.body;
    const db = readDB();
    const index = (db.chatSessions || []).findIndex(s => s._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Session not found' });

    db.chatSessions[index].messages.push({ role, content });
    db.chatSessions[index].updatedAt = new Date().toISOString();
    
    if (db.chatSessions[index].title === 'New Conversation' && role === 'user') {
        db.chatSessions[index].title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }

    await writeDB(db);
    res.json(db.chatSessions[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
