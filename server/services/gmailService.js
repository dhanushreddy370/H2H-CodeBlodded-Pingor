const { getGmailClient } = require('../config/gmail');

/**
 * Creates an email draft as an auto-reply within a specific thread.
 * @param {string} threadId 
 * @param {string} to 
 * @param {string} subject 
 * @param {string} body 
 */
async function createAutoReplyDraft(threadId, to, subject, body) {
  try {
    const gmail = getGmailClient();
    
    // Ensure subject has Re: if not already
    const finalSubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;

    const messageLines = [
      `To: ${to}`,
      `Subject: ${finalSubject}`,
      '',
      body
    ];

    // RFC 2822 formatting requires base64url encoding
    const emailRaw = Buffer.from(messageLines.join('\n')).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const draftBody = {
      message: {
        raw: emailRaw,
        threadId: threadId
      }
    };

    await gmail.users.drafts.create({ userId: 'me', requestBody: draftBody });
    return true;
  } catch (error) {
    console.error(`Failed to create auto-reply draft for thread ${threadId}:`, error.message);
    return false;
  }
}

module.exports = {
  createAutoReplyDraft
};
