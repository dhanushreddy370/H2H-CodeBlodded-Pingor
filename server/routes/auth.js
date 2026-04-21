const express = require('express');
const router = express.Router();
const { oauth2Client, getAuthUrl, setCredentials } = require('../config/gmail');
const { google } = require('googleapis');

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

module.exports = router;
