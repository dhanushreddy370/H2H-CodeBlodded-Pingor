const express = require('express');
const router = express.Router();
const { generateChatResponse } = require('../services/aiService');
const { readDB, writeDB } = require('../services/dbService');

// Context Injection Endpoint
router.post('/context', (req, res) => {
  try {
    const { taskIds = [], followUpIds = [] } = req.body;
    let contextParts = [];
    const db = readDB();

    if (taskIds.length > 0) {
      const tasks = (db.actionItems || []).filter(t => taskIds.includes(t._id));
      if (tasks.length > 0) {
        contextParts.push('--- RELEVANT TASKS ---');
        tasks.forEach(t => {
          contextParts.push(`Task: ${t.action}\nStatus: ${t.status}\nPriority: P${t.priority}\nDeadline: ${t.deadline || 'None'}`);
        });
      }
    }

    if (followUpIds.length > 0) {
      const threads = (db.threads || []).filter(th => followUpIds.includes(th._id));
      if (threads.length > 0) {
        contextParts.push('--- RELEVANT EMAIL THREADS ---');
        threads.forEach(th => {
          contextParts.push(`Subject: ${th.subject}\nSender: ${th.sender}\nSnippet: ${th.snippet}`);
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
    const { messages, userId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const aiText = await generateChatResponse(messages);
    
    // Optional: Save to chatSessions in JSON DB if userId is provided
    if (userId) {
       const db = readDB();
       if (!db.chatSessions) db.chatSessions = [];
       // Add logic to save conversation if needed
    }

    res.json({ text: aiText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
