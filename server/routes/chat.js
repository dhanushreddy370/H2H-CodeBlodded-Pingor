const express = require('express');
const router = express.Router();
const ActionItem = require('../models/ActionItem');
const Thread = require('../models/Thread');

// Context Injection Endpoint
router.post('/context', async (req, res) => {
  try {
    const { taskIds = [], followUpIds = [] } = req.body;
    let contextParts = [];

    if (taskIds.length > 0) {
      const tasks = await ActionItem.find({ _id: { $in: taskIds } });
      if (tasks.length > 0) {
        contextParts.push('--- TASKS ---');
        tasks.forEach(t => {
          contextParts.push(`Task [${t._id}]: ${t.action} - Status: ${t.status} - Priority: ${t.priority} - Deadline: ${t.deadline} - Owner: ${t.owner}`);
        });
      }
    }

    if (followUpIds.length > 0) {
      const threads = await Thread.find({ _id: { $in: followUpIds } });
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

module.exports = router;
