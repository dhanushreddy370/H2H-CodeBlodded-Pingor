const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const db = readDB();
    const sessions = db.chatSessions.filter(s => s.userId === userId).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Return only metadata
    const metadata = sessions.map(s => ({
      _id: s._id,
      title: s.title,
      updatedAt: s.updatedAt,
      messageCount: s.messages ? s.messages.length : 0
    }));

    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific chat session with its messages
router.get('/:id', async (req, res) => {
  try {
    const db = readDB();
    const session = db.chatSessions.find(s => s._id === req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new chat session
router.post('/', async (req, res) => {
  try {
    const { userId, title, initialMessage } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const db = readDB();
    const newSession = {
      _id: uuidv4(),
      userId,
      title: title || 'New Conversation',
      messages: initialMessage ? [initialMessage] : [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    db.chatSessions.push(newSession);
    writeDB(db);

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a message to an existing session
router.post('/:id/messages', async (req, res) => {
  try {
    const { role, content, actionType } = req.body;
    if (!role || !content) return res.status(400).json({ error: 'role and content are required' });

    const db = readDB();
    const sIndex = db.chatSessions.findIndex(s => s._id === req.params.id);
    if (sIndex === -1) return res.status(404).json({ error: 'Session not found' });

    db.chatSessions[sIndex].messages.push({
      role,
      content,
      actionType,
      timestamp: new Date().toISOString()
    });
    db.chatSessions[sIndex].updatedAt = new Date().toISOString();
    
    // Auto-generate title based on first user message if title is still 'New Conversation'
    if (db.chatSessions[sIndex].title === 'New Conversation' && role === 'user') {
        db.chatSessions[sIndex].title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }

    writeDB(db);
    res.json(db.chatSessions[sIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
