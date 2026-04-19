const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');

// Get follow-up threads with sorting & filtering
router.get('/', async (req, res) => {
  try {
    const { priority, status, type, sender, timeSinceReply } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (sender) query.sender = new RegExp(sender, 'i');
    
    let sortObj = { lastUpdated: -1 };
    if (priority === 'asc') sortObj.priority = 1;
    if (priority === 'desc') sortObj.priority = -1;
    if (timeSinceReply === 'asc') sortObj.lastUpdated = -1;
    if (timeSinceReply === 'desc') sortObj.lastUpdated = 1;

    const followups = await Thread.find(query).sort(sortObj);
    res.json(followups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update thread
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const thread = await Thread.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
