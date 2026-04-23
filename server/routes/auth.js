const express = require('express');
const router = express.Router();
const { oauth2Client, getAuthUrl, getTokensFromCode, getClientForUser } = require('../utils/googleClient');
const { google } = require('googleapis');
const { readDB, writeDB } = require('../services/dbService');

// --- Remote Routes (OAuth) ---

// Route to get the Google OAuth URL
router.get('/url', (req, res) => {
  try {
    const { userId } = req.query;
    const url = getAuthUrl(userId); 
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to handle the callback from Google
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('<h1>Authorization code is required</h1>');
  }

  try {
    // 1. Get tokens from Google using the code
    const tokens = await getTokensFromCode(code);
    
    // 2. Use tokens to get user profile information
    const tempClient = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    tempClient.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: tempClient });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      throw new Error('Email not provided by Google');
    }

    // 3. Update or Create user in our DB
    const db = readDB();
    let userIndex = db.users.findIndex(u => u.email.toLowerCase() === userInfo.email.toLowerCase());
    
    const userUpdate = {
      id: userInfo.id,
      sub: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      tokens: tokens, // Stores BOTH profile tokens and Gmail permissions
      gmailConnected: true,
      updatedAt: new Date().toISOString()
    };

    if (userIndex !== -1) {
      db.users[userIndex] = { ...db.users[userIndex], ...userUpdate };
    } else {
      db.users.push({ ...userUpdate, createdAt: new Date().toISOString() });
      userIndex = db.users.length - 1;
    }
    
    await writeDB(db);

    // Filter out sensitive tokens before sending back to frontend
    const safeUser = { ...db.users[userIndex] };
    delete safeUser.tokens;

    // 4. Send back a script to the popup that communicates with the opener
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
          <script>
            // Use '*' as target origin to ensure communication between port 5000 (backend) and 3000 (frontend)
            window.opener.postMessage({ 
              type: 'AUTH_SUCCESS', 
              user: ${JSON.stringify(safeUser)} 
            }, '*');
            setTimeout(() => {
              window.close();
            }, 1000);
          </script>
          <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center;">
            <h2 style="color: #2563eb; margin-bottom: 10px;">Login Successful!</h2>
            <p style="color: #64748b;">Hang tight, we're taking you to your dashboard...</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fef2f2;">
          <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center;">
            <h2 style="color: #dc2626; margin-bottom: 10px;">Authentication Failed</h2>
            <p style="color: #64748b;">${error.message}</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 25px; background: #dc2626; color: white; border: none; border-radius: 10px; cursor: pointer;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }
});

// Route to handle the callback from Google (POST version for frontend components)
router.post('/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Authorization code is required' });
  }

  try {
    const tokens = await getTokensFromCode(code);
    const tempClient = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    tempClient.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: tempClient });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      throw new Error('Email not provided by Google');
    }

    const db = readDB();
    let userIndex = db.users.findIndex(u => u.email.toLowerCase() === userInfo.email.toLowerCase());
    
    const userUpdate = {
      id: userInfo.id,
      sub: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      tokens: tokens,
      gmailConnected: true,
      updatedAt: new Date().toISOString()
    };

    if (userIndex !== -1) {
      db.users[userIndex] = { ...db.users[userIndex], ...userUpdate };
    } else {
      db.users.push({ ...userUpdate, createdAt: new Date().toISOString() });
      userIndex = db.users.length - 1;
    }
    
    await writeDB(db);

    const safeUser = { ...db.users[userIndex] };
    delete safeUser.tokens;

    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('OAuth POST Callback Error:', error);
    res.status(500).json({ success: false, error: error.message });
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
  
  if (user) {
    const { tokens, ...safeUser } = user;
    res.json({ exists: true, user: safeUser });
  } else {
    res.json({ exists: false });
  }
});

// Register or update user
router.post('/register', async (req, res) => {
  const { userData } = req.body;
  if (!userData || !userData.email) {
    return res.status(400).json({ error: 'User data with email is required' });
  }

  const db = readDB();
  const existingUserIndex = db.users.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase());

  let finalUser;
  if (existingUserIndex > -1) {
    // Update existing user
    db.users[existingUserIndex] = { ...db.users[existingUserIndex], ...userData, updatedAt: new Date().toISOString() };
    finalUser = db.users[existingUserIndex];
  } else {
    // Create new user
    finalUser = { 
      ...userData, 
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(finalUser);
  }

  await writeDB(db);
  const { tokens, ...safeUser } = finalUser;
  res.json({ success: true, user: safeUser });
});

module.exports = router;
