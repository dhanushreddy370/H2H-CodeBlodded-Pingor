const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');

// Get all tasks
router.get('/', (req, res) => {
  try {
    const { deadline, userId, status, priority } = req.query;
    const db = readDB();
    const actionItems = db.actionItems || [];
    
    let filtered = actionItems;
    if (userId && userId !== 'undefined') {
      filtered = actionItems.filter(item => 
        item.userId === userId || item.userId === 'test-user-id' || !item.userId
      );
    }

    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    // sorting logic: "done" tasks always at bottom
    filtered.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      
      if (priority === 'asc') return (a.priority || 3) - (b.priority || 3);
      if (priority === 'desc') return (b.priority || 3) - (a.priority || 3);

      // Secondary sort: Deadline
      if (deadline === 'asc') return new Date(a.deadline || '9999') - new Date(b.deadline || '9999');
      if (deadline === 'desc') return new Date(b.deadline || '1970') - new Date(a.deadline || '1970');
      
      // Default: Priority
      return (a.priority || 3) - (b.priority || 3);
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const db = readDB();
    if (!db.actionItems) db.actionItems = [];
    
    const newTask = {
      _id: `task-${Date.now()}`,
      ...req.body,
      status: req.body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.actionItems.push(newTask);
    await writeDB(db);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update full task
router.patch('/:id', async (req, res) => {
  try {
    const db = readDB();
    const index = (db.actionItems || []).findIndex(t => t._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    
    db.actionItems[index] = {
      ...db.actionItems[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeDB(db);
    res.json(db.actionItems[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick status update
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const db = readDB();
    const index = (db.actionItems || []).findIndex(t => t._id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    
    db.actionItems[index].status = status;
    db.actionItems[index].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    res.json(db.actionItems[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
