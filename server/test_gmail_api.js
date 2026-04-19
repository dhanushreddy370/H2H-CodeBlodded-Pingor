const { getGmailClient, loadSavedTokens } = require('./config/gmail');

async function test() {
  if (!loadSavedTokens()) {
    console.log('No tokens');
    return;
  }
  const gmail = getGmailClient();
  
  try {
    console.log('Testing without q:');
    const res1 = await gmail.users.threads.list({ userId: 'me', maxResults: 5 });
    console.log('Success, found', res1.data.threads.length, 'threads.');
  } catch (err) {
    console.error('Error 1:', err.message);
  }

  try {
    console.log('Testing with q="" :');
    const res2 = await gmail.users.threads.list({ userId: 'me', q: "", maxResults: 5 });
    console.log('Success, found', res2.data.threads.length, 'threads.');
  } catch (err) {
    console.error('Error 2:', err.message);
  }
}

test();
