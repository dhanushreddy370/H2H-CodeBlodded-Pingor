const { getGmailClient, loadSavedTokens } = require('./config/gmail');

async function testName() {
  if (!loadSavedTokens()) return;
  const gmail = getGmailClient();
  try {
    const res = await gmail.users.settings.sendAs.list({ userId: 'me' });
    console.log("SendAs:", res.data.sendAs);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
testName();
