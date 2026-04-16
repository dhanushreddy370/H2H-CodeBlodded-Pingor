const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Configure OAuth2 client for Gmail API access.
 * Note: You need to set client_id, client_secret, and redirect_uri in your .env file.
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Scopes for Gmail API
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send'
];

/**
 * Generates an authentication URL to redirect users to.
 */
const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

/**
 * Sets credentials from the authorized code.
 * @param {string} code - The authorization code from the redirect URI.
 */
const setCredentials = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

/**
 * Returns an instance of the Gmail API client.
 */
const getGmailClient = (auth) => {
  return google.gmail({ version: 'v1', auth });
};

module.exports = {
  oauth2Client,
  getAuthUrl,
  setCredentials,
  getGmailClient
};
