const express = require('express');
const router = express.Router();
const { readDB } = require('../services/dbService');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const db = readDB();
    
    let filtered = db.threads;
    
    if (userId && userId !== 'undefined') {
      filtered = filtered.filter(t => t.userId === userId || t.userId === "test-user-id");
    } else {
      filtered = filtered.filter(t => t.userId === "test-user-id" || !t.userId);
    }

    // Sort by lastUpdated desc
    filtered.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
