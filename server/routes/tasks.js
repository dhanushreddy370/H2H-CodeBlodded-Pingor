const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');

router.get('/', async (req, res) => {
  try {
    const { deadline, priority, status, userId } = req.query;
    
    let query = {};
    if (userId && userId !== 'undefined') {
      query = { $or: [{ userId }, { userId: 'test-user-id' }] };
    }

    if (status) query.status = status;

    let tasks = await Task.find(query).populate('assignees');
    
    // sorting logic: "done" tasks always at bottom
    tasks.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      
      // Secondary sort: Deadline
      if (deadline === 'asc') return (a.deadline || Infinity) - (b.deadline || Infinity);
      if (deadline === 'desc') return (b.deadline || 0) - (a.deadline || 0);
      
      // Default: Priority
      return (a.priority || 3) - (b.priority || 3);
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update full task (for detail modal)
router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick status update
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
