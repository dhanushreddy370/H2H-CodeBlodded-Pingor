const express = require('express');
const router = express.Router();
const { oauth2Client, getAuthUrl, setCredentials } = require('../config/gmail');
const { google } = require('googleapis');
const { readDB, writeDB } = require('../services/dbService');

// --- Remote Routes (OAuth) ---

// Route to get the Google OAuth URL
router.get('/url', (req, res) => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to handle the callback from Google
router.post('/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const tokens = await setCredentials(code);
    
    // Fetch user info using the tokens
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    res.json({
      success: true,
      user: {
        id: userInfo.data.id,
        name: userInfo.data.name,
        email: userInfo.data.email,
        avatar: userInfo.data.picture
      }
    });
  } catch (error) {
    console.error('OAuth Callback Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Local Refinement Routes (User Management) ---

// Check if user exists
router.get('/check-user', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  res.json({ exists: !!user, user });
});

// Register or update user
router.post('/register', (req, res) => {
  const { userData } = req.body;
  if (!userData || !userData.email) {
    return res.status(400).json({ error: 'User data with email is required' });
  }

  const db = readDB();
  const existingUserIndex = db.users.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase());

  if (existingUserIndex > -1) {
    // Update existing user
    db.users[existingUserIndex] = { ...db.users[existingUserIndex], ...userData, updatedAt: new Date().toISOString() };
  } else {
    // Create new user
    db.users.push({ 
      ...userData, 
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  writeDB(db);
  res.json({ success: true, user: userData });
});

module.exports = router;
