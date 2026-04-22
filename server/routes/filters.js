const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { generateFilterQuery } = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

router.post('/generate', async (req, res) => {
  try {
    const { prompt, name } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    
    const mongoQuery = await generateFilterQuery(prompt);
    
    const db = readDB();
    const filter = {
      _id: uuidv4(),
      name: name || 'Custom Filter',
      queryPrompt: prompt,
      mongoQuery: mongoQuery,
      createdAt: new Date().toISOString()
    };
    db.filters.push(filter);
    await writeDB(db);
    
    res.json(filter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const db = readDB();
    const filters = db.filters.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(filters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
