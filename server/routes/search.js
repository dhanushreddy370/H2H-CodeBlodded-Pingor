const express = require('express');
const router = express.Router();
const { DEMO_QUERIES, executeSearch } = require('../services/searchService');

router.get('/demo-queries', (req, res) => {
  res.json({ queries: DEMO_QUERIES });
});

router.post('/', (req, res) => {
  try {
    const { userId, prompt } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    res.json(executeSearch({ userId, prompt }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
