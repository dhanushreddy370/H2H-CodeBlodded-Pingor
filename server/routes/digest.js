const express = require('express');
const router = express.Router();
const { buildDigest } = require('../services/digestService');

router.get('/', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    res.json(buildDigest(userId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
