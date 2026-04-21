const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users (for assignment dropdowns)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get/Create current user profile
router.post('/profile', async (req, res) => {
  try {
    const { userId, email, name, picture } = req.body;
    let user = await User.findOne({ userId });
    
    if (!user) {
      user = new User({ userId, email, name, picture });
    } else {
      user.name = name || user.name;
      user.picture = picture || user.picture;
    }
    
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.patch('/settings', async (req, res) => {
  try {
    const { userId, settings } = req.body;
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { settings, updatedAt: new Date() } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
