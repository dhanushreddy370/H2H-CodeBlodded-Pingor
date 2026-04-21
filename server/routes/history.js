const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const sessions = await ChatHistory.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title updatedAt updatedAt');
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await ChatHistory.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, title, initialMessage } = req.body;
    const newSession = new ChatHistory({
      userId,
      title: title || 'New Conversation',
      messages: initialMessage ? [initialMessage] : []
    });
    await newSession.save();
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { role, content } = req.body;
    const session = await ChatHistory.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.messages.push({ role, content });
    session.updatedAt = new Date();
    
    if (session.title === 'New Conversation' && role === 'user') {
        session.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
