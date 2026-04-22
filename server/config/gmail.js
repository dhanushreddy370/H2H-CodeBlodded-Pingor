const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const { readDB, writeDB } = require('../services/dbService');

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Configure OAuth2 client for Gmail API access.
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Unified Scopes: Identity + Gmail
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send'
];

/**
 * Generates an authentication URL to redirect users to.
 */
const getAuthUrl = (state = '') => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    include_granted_scopes: true,
    state: state
  });
};

/**
 * Gets a configured OAuth client for a specific user.
 */
const getClientForUser = (userId) => {
  if (!userId) throw new Error('User ID is required.');

  const db = readDB();
  const user = db.users.find(u => 
    u.id === userId || u.sub === userId || u.email === userId
  );
  
  if (!user || !user.tokens) {
    throw new Error('Gmail account not connected or user not found.');
  }

  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  
  client.setCredentials(user.tokens);
  return client;
};

/**
 * Direct token exchange from code
 */
const getTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

module.exports = {
  oauth2Client,
  getAuthUrl,
  getClientForUser,
  getTokensFromCode,
  getGmailClient: (auth) => google.gmail({ version: 'v1', auth })
};
