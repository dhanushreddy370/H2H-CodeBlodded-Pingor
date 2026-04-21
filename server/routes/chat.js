const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { generateChatResponse } = require('../services/aiService');
const ChatSession = require('../models/ChatSession'); // Keeping for reference/migration if needed

// Get all chat sessions
router.get('/history', async (req, res) => {
  try {
    const sessions = await ChatSession.find().sort({ lastMessageAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update session
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message, title } = req.body;
    
    let session;
    if (sessionId) {
      session = await ChatSession.findById(sessionId);
    }

    if (!session) {
      session = new ChatSession({ title: title || 'New Chat', messages: [] });
    }

    session.messages.push(message);
    session.lastMessageAt = new Date();
    await session.save();
    
    // Simulate AI response (In real app, call Ollama here)
    const aiResponse = {
      role: 'assistant',
      text: `Pingor processed your request about: "${message.text}". Context from ${message.chips?.length || 0} items analyzed.`,
      timestamp: new Date()
    };
    session.messages.push(aiResponse);
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Context Injection Endpoint (existing)
router.post('/context', async (req, res) => {
  try {
    const { taskIds = [], followUpIds = [] } = req.body;
    let contextParts = [];
    if (taskIds.length > 0) {
      const db = readDB();
      const tasks = db.actionItems.filter(t => taskIds.includes(t._id));
      if (tasks.length > 0) {
        contextParts.push('--- TASKS ---');
        tasks.forEach(t => {
          contextParts.push(`Task [${t._id}]: ${t.action} - Status: ${t.status} - Priority: ${t.priority} - Deadline: ${t.deadline} - Owner: ${t.owner}`);
        });
      }
    }

    if (followUpIds.length > 0) {
      const db = readDB();
      const threads = db.threads.filter(th => followUpIds.includes(th._id));
      if (threads.length > 0) {
        contextParts.push('--- FOLLOW-UPS ---');
        threads.forEach(th => {
          contextParts.push(`Follow-up [${th._id}]: ${th.subject} - Status: ${th.status} - Priority: ${th.priority} - Sender: ${th.sender}\nSnippet: ${th.snippet}`);
        });
      }
    }

    res.json({ contextBlock: contextParts.join('\n\n') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real Chat Endpoint
router.post('/ask', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await generateChatResponse(messages);
    res.json({ text: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
