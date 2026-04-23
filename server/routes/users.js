const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { initHeartbeat } = require('../services/syncService');

// Get all users (for assignment dropdowns)
router.get('/', (req, res) => {
  try {
    const db = readDB();
    const users = (db.users || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get/Create current user profile
router.post('/profile', async (req, res) => {
  try {
    const { userId, email, name, picture } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const db = readDB();
    if (!db.users) db.users = [];

    let index = db.users.findIndex(u => u.userId === userId);
    
    if (index === -1) {
      const newUser = {
        _id: `user-${Date.now()}`,
        userId,
        email,
        name,
        picture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(newUser);
      index = db.users.length - 1;
    } else {
      db.users[index] = {
        ...db.users[index],
        name: name || db.users[index].name,
        picture: picture || db.users[index].picture,
        updatedAt: new Date().toISOString()
      };
    }
    
    await writeDB(db);
    res.json(db.users[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.patch('/settings', async (req, res) => {
  await handleSettingsUpdate(req, res);
});

// Alias for settings per UI overhaul requirements
router.patch('/preferences', async (req, res) => {
  await handleSettingsUpdate(req, res);
});

async function handleSettingsUpdate(req, res) {
  try {
    const { userId, settings } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    const db = readDB();
    const index = (db.users || []).findIndex(u => u.userId === userId);
    
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    
    db.users[index].settings = {
      ...(db.users[index].settings || {}),
      ...settings
    };
    db.users[index].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    // Refresh heartbeat with new settings
    initHeartbeat();
    res.json(db.users[index]);
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = router;
