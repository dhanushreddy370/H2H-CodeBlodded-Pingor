const express = require('express');
const router = express.Router();
const { readDB } = require('../services/dbService');
const { createSyntheticThreads } = require('../services/demoDataService');

router.post('/seed', async (req, res) => {
  try {
    const { userId, count } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const db = readDB();
    const user = (db.users || []).find((entry) => entry.userId === userId || entry.id === userId || entry.sub === userId || entry.email === userId);
    const summary = await createSyntheticThreads({
      userId,
      userEmail: user?.email || '',
      totalThreads: Number(count) || 120
    });

    res.json({ success: true, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
