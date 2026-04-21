const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { v4: uuidv4 } = require('uuid');
router.get('/', async (req, res) => {
  try {
    const { deadline, priority, status, type, sender, filterId, userId } = req.query;
    const db = readDB();
    console.log(`GET /api/tasks: userId=${userId}, db.items=${db.actionItems.length}`);
    
    let filtered = db.actionItems;
    
    if (userId && userId !== 'undefined') {
      filtered = filtered.filter(t => t.userId === userId || t.userId === "test-user-id");
    } else {
      filtered = filtered.filter(t => t.userId === "test-user-id" || !t.userId);
    }
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }
    if (sender) {
      const senderRegex = new RegExp(sender, 'i');
      filtered = filtered.filter(t => senderRegex.test(t.sender));
    }
    
    // Sort logic
    filtered.sort((a, b) => {
      // Default: createdAt desc
      let dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      let dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      let diff = dateB - dateA;
      
      if (deadline === 'asc') diff = (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity);
      if (deadline === 'desc') diff = (b.deadline ? new Date(b.deadline).getTime() : 0) - (a.deadline ? new Date(a.deadline).getTime() : 0);
      if (priority === 'asc') diff = (a.priority || 3) - (b.priority || 3);
      if (priority === 'desc') diff = (b.priority || 3) - (a.priority || 3);
      
      return diff;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status (e.g. Mark as Done)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const db = readDB();
    const taskIndex = db.actionItems.findIndex(t => t._id === req.params.id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.actionItems[taskIndex].status = status;
    db.actionItems[taskIndex].updatedAt = new Date().toISOString();
    writeDB(db);
    
    res.json(db.actionItems[taskIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
