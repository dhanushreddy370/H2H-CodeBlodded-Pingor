const { getGmailClient, loadSavedTokens } = require('./config/gmail');

async function testSend() {
  if (!loadSavedTokens()) {
    console.log('No tokens');
    return;
  }
  const gmail = getGmailClient();
  const to = "dhanush111115@gmail.com";
  const finalSubject = "Test Subject";
  const body = "Test Body";
  try {
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

    const requestBody = {
      raw: emailRaw
    };

    console.log('Sending...');
    const result = await gmail.users.messages.send({ userId: 'me', requestBody });
    console.log('Success:', result.data);
  } catch (err) {
    console.error('Error:', err.message);
    if(err.response) console.error(err.response.data);
  }
}

testSend();
