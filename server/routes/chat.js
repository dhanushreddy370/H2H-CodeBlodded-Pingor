const express = require('express');
const router = express.Router();
const { readDB } = require('../services/dbService');
const { generateChatResponse } = require('../services/aiService');

// Context Injection Endpoint
router.post('/context', async (req, res) => {
  try {
    const { taskIds = [], followUpIds = [] } = req.body;
    let contextParts = [];

      const db = readDB();
      const tasks = db.actionItems.filter(t => taskIds.includes(t._id));
      if (tasks.length > 0) {
        contextParts.push('--- TASKS ---');
        tasks.forEach(t => {
          contextParts.push(`Task [${t._id}]: ${t.action} - Status: ${t.status} - Priority: ${t.priority} - Deadline: ${t.deadline} - Owner: ${t.owner}`);
        });
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

    const contextBlock = contextParts.join('\n');
    res.json({ contextBlock });
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
