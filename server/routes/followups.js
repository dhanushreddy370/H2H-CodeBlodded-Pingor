const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
router.get('/', async (req, res) => {
  try {
    const { priority, status, type, sender, timeSinceReply, userId } = req.query;
    const db = readDB();
    
    let filtered = db.threads;
    
    if (userId) filtered = filtered.filter(t => t.userId === userId);
    if (status) filtered = filtered.filter(t => t.status === status);
    if (type) filtered = filtered.filter(t => t.type === type);
    if (sender) {
      const senderRegex = new RegExp(sender, 'i');
      filtered = filtered.filter(t => senderRegex.test(t.sender));
    }
    
    filtered.sort((a, b) => {
      let dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      let dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      let diff = dateB - dateA;
      
      if (priority === 'asc') diff = (a.priority || 3) - (b.priority || 3);
      if (priority === 'desc') diff = (b.priority || 3) - (a.priority || 3);
      if (timeSinceReply === 'asc') diff = dateB - dateA;
      if (timeSinceReply === 'desc') diff = dateA - dateB;

      return diff;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update thread
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const db = readDB();
    const tIndex = db.threads.findIndex(t => t._id === req.params.id);
    
    if (tIndex === -1) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    db.threads[tIndex].status = status;
    db.threads[tIndex].updatedAt = new Date().toISOString();
    writeDB(db);
    
    res.json(db.threads[tIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
