const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/ollama', async (req, res) => {
  try {
    const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const start = Date.now();
    await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 2000 });
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      res.json({ status: 'slow', message: 'Ollama is slow' });
    } else {
      res.json({ status: 'online', message: 'Ollama is online' });
    }
  } catch (err) {
    res.json({ status: 'offline', message: 'Ollama is offline' });
  }
});

module.exports = router;
