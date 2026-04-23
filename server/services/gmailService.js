const { getClientForUser } = require('../utils/googleClient');
const { google } = require('googleapis');

/**
 * Creates an email draft. If threadId is provided, treated as a reply (Re: prefix added).
 * If no threadId, treated as a new compose — subject used as-is.
 */
async function createAutoReplyDraft(userId, threadId, to, subject, body) {
  try {
    const client = getClientForUser(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    const finalSubject = threadId
      ? (subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`)
      : subject;

    const messageLines = [
      `To: ${to}`,
      `Subject: ${finalSubject}`,
      '',
      body
    ];

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

/**
 * Sends an email immediately via Gmail API.
 * If threadId provided, sends as a reply in that thread.
 */
async function sendEmail(userId, threadId, to, subject, body) {
  try {
    const client = getClientForUser(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    const finalSubject = threadId
      ? (subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`)
      : subject;

    const messageLines = [
      `To: ${to}`,
      `Subject: ${finalSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset="UTF-8"`,
      '',
      body
    ];

    const emailRaw = Buffer.from(messageLines.join('\n')).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const requestBody = { raw: emailRaw };
    if (threadId) requestBody.threadId = threadId;

    await gmail.users.messages.send({ userId: 'me', requestBody });
    return true;
  } catch (error) {
    console.error(`Failed to send email:`, error.message);
    return false;
  }
}

module.exports = {
  createAutoReplyDraft,
  sendEmail
};
