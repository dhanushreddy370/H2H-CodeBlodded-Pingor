const express = require('express');
const router = express.Router();
const Filter = require('../models/Filter');
const { generateFilterQuery } = require('../services/aiService');

router.post('/generate', async (req, res) => {
  try {
    const { prompt, name } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    
    const mongoQuery = await generateFilterQuery(prompt);
    
    // Save to Filters collection
    const filter = new Filter({
      name: name || 'Custom Filter',
      queryPrompt: prompt,
      mongoQuery: mongoQuery
    });
    await filter.save();
    
    res.json(filter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filters = await Filter.find().sort({ createdAt: -1 });
    res.json(filters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
