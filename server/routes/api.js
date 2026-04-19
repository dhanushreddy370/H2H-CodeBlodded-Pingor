const express = require('express');
const router = express.Router();
const ActionItem = require('../models/ActionItem');
const Filter = require('../models/Filter');
const { generateMongoQueryFromPrompt } = require('../services/aiService');

// Advanced API Endpoints

// GET /api/tasks: Support query params for status (pending/done) and sortBy (deadline)
router.get('/tasks', async (req, res) => {
  try {
    const { status, type, sortBy } = req.query;
    let query = {};
    
    if (status) query.status = status;
    // Note: ActionItem schema relies on `action` primarily, so filtering by type might rely on regex if added later.
    
    let queryBuilder = ActionItem.find(query);
    
    if (sortBy === 'deadline') {
      queryBuilder = queryBuilder.sort({ deadline: 1 });
    }
    
    const tasks = await queryBuilder.exec();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id: To mark tasks as done.
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedTask = await ActionItem.findByIdAndUpdate(
      req.params.id, 
      { status: status || 'done' }, 
      { new: true }
    );
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/filters: For the AI agent to save a named custom filter.
router.post('/filters', async (req, res) => {
  try {
    const { name, naturalLanguagePrompt } = req.body;
    
    if (!naturalLanguagePrompt) {
      return res.status(400).json({ error: 'naturalLanguagePrompt is required' });
    }

    // Call AI Service to translate natural language into Mongo query
    const mongoQuery = await generateMongoQueryFromPrompt(naturalLanguagePrompt);
    
    const newFilter = await Filter.create({
      name: name || naturalLanguagePrompt,
      naturalLanguagePrompt,
      mongoQuery
    });
    
    res.json(newFilter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
