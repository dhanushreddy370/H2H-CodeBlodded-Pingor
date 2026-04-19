const express = require('express');
const router = express.Router();
const ActionItem = require('../models/ActionItem');

// Get tasks with optional query params for sorting & filtering
router.get('/', async (req, res) => {
  try {
    const { deadline, priority, status, type, sender, filterId } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (sender) query.sender = new RegExp(sender, 'i');
    
    // Sort logic
    let sortObj = { createdAt: -1 };
    if (deadline === 'asc') sortObj.deadline = 1;
    if (deadline === 'desc') sortObj.deadline = -1;
    if (priority === 'asc') sortObj.priority = 1;
    if (priority === 'desc') sortObj.priority = -1;

    const tasks = await ActionItem.find(query).sort(sortObj);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status (e.g. Mark as Done)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await ActionItem.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
