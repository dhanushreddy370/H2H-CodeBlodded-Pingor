const express = require('express');
const router = express.Router();
const { createAutoReplyDraft, sendEmail } = require('../services/gmailService');

router.post('/send-draft', async (req, res) => {
  try {
    const { userId, threadId, to, subject, body } = req.body;
    if (!userId || !to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields (userId, to, subject, body)' });
    }
    const success = await createAutoReplyDraft(userId, threadId || null, to, subject, body);
    if (success) {
      res.json({ success: true, message: 'Draft created successfully in Gmail' });
    } else {
      res.status(500).json({ error: 'Failed to create draft in Gmail' });
    }
  } catch (err) {
    console.error('Send draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-now', async (req, res) => {
  try {
    const { userId, threadId, to, subject, body } = req.body;
    if (!userId || !to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields (userId, to, subject, body)' });
    }
    const success = await sendEmail(userId, threadId || null, to, subject, body);
    if (success) {
      res.json({ success: true, message: 'Email sent successfully via Gmail' });
    } else {
      res.status(500).json({ error: 'Failed to send email via Gmail' });
    }
  } catch (err) {
    console.error('Send now error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
