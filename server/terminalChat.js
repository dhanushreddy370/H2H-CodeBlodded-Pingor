const readline = require('readline');
const axios = require('axios');
const dotenv = require('dotenv');
const { oauth2Client, getAuthUrl, setCredentials, getGmailClient } = require('./config/gmail');

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';

async function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 1. Asynchronously pre-load the model into the GPU
async function preloadModelToGPU() {
  console.log(`[SYS] Asynchronously loading model '${OLLAMA_MODEL}' into GPU/Memory...`);
  try {
    // Send a blank prompt to force Ollama to spin up the model before we chat
    await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: '',
      keep_alive: '5m' // Keep it loaded
    });
    console.log(`[SYS] Model '${OLLAMA_MODEL}' successfully loaded into memory!`);
  } catch (error) {
    if (error.response?.data?.error?.includes('prompt is required')) {
      console.log(`[SYS] Model '${OLLAMA_MODEL}' successfully initialized into memory! (via ping)`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`[SYS] Warning: Ollama isn't running at localhost:11434.`);
    } else {
      console.log(`[SYS] Model '${OLLAMA_MODEL}' pre-loaded successfully!`);
    }
  }
}

async function authenticateGmail() {
  if (!process.env.GMAIL_CLIENT_ID || process.env.GMAIL_CLIENT_ID === 'your_client_id_here') {
    console.log('\n[SYS] No GMAIL_CLIENT_ID found in your .env file.');
    console.log('[SYS] Falling back to OFFLINE Mock Emails to let you test the AI properly.\n');
    return null; // Signals we should use mock data
  }

  const authUrl = getAuthUrl();
  console.log('\n=== GMAIL AUTHENTICATION ===');
  console.log('Please authorize this app by visiting this url:\n');
  console.log(authUrl, '\n');
  const code = await askQuestion('Enter the code from that page here: ');
  
  if (!code.trim()) {
    console.error('❌ No code entered. Exiting.');
    process.exit(1);
  }

  try {
    await setCredentials(code.trim());
    console.log('✅ Successfully authenticated with Gmail!\n');
    return getGmailClient(oauth2Client);
  } catch (error) {
    console.error('❌ Error authenticating:', error.message);
    console.log('[SYS] Falling back to OFFLINE Mock Emails due to auth failure.\n');
    return null;
  }
}

async function fetchLatestEmails(gmail) {
  if (!gmail) {
    console.log('[SYS] Simulating email fetch from Gmail (Offline mode)...');
    return `Here is the context of my latest emails:

From: boss@company.com
Subject: Action Required: Server Migration
Snippet: Don't forget that we are migrating the production server this Friday at 11 PM. You are on call so please prep your tools and monitor the Slack channels!

From: hr@company.com
Subject: Team Building Activity
Snippet: Quick reminder that we have our team building lunch at 1 PM tomorrow. See you there!`;
  }

  console.log('Fetching your latest 5 emails from Gmail API...');
  try {
    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults: 5,
    });
    
    const threads = response.data.threads || [];
    let emailsContext = "Here is the context of my latest emails:\n\n";

    for (const t of threads) {
      const threadDetails = await gmail.users.threads.get({
        userId: 'me',
        id: t.id,
      });

      const snippet = threadDetails.data.snippet;
      const messages = threadDetails.data.messages || [];
      const firstMessage = messages[0];
      const headers = firstMessage?.payload?.headers || [];
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
      const senderHeader = headers.find(h => h.name.toLowerCase() === 'from');
      
      const subject = subjectHeader ? subjectHeader.value : '(No Subject)';
      const sender = senderHeader ? senderHeader.value : 'Unknown';

      emailsContext += `From: ${sender}\nSubject: ${subject}\nSnippet: ${snippet}\n\n`;
    }
    console.log('✅ Live Emails fetched and ready to be analyzed by Ollama!\n');
    return emailsContext;
  } catch (err) {
    console.error('❌ Error fetching emails:', err.message);
    return 'Could not fetch emails.';
  }
}

async function startChat(context) {
  console.log('=======================================');
  console.log('        OLLAMA CHAT INTERFACE          ');
  console.log('=======================================');
  console.log('Type "exit" to quit the chat.\n');

  let conversationHistory = [
    {
      role: 'system',
      content: `You are Pingor, an intelligent, privacy-first local AI assistant. The user will ask you questions about their emails. Address the user politely and answer questions based solely on the email context provided.\n\n${context}`
    }
  ];

  const chatLoop = async () => {
    const userPrompt = await askQuestion('You: ');
    
    if (userPrompt.trim().toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    if (!userPrompt.trim()) return chatLoop();

    conversationHistory.push({ role: 'user', content: userPrompt });

    try {
      process.stdout.write('Ollama (Pingor): ');
      
      const response = await axios.post(OLLAMA_URL, {
        model: OLLAMA_MODEL,
        messages: conversationHistory,
        stream: true
      }, { responseType: 'stream' });

      let fullResponse = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              process.stdout.write(parsed.message.content);
              fullResponse += parsed.message.content;
            }
          } catch (e) {
            // Ignore parse errors on individual chunks
          }
        }
      });

      response.data.on('end', () => {
        console.log('\n');
        conversationHistory.push({ role: 'assistant', content: fullResponse });
        chatLoop();
      });

      response.data.on('error', (err) => {
        console.log(`\n❌ Stream error: ${err.message}\n`);
        chatLoop();
      });

    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
          console.log('\n❌ Error: Cannot connect to Ollama. Ensure the server is running on localhost:11434.\n');
      } else {
          console.log(`\n❌ Error communicating with Ollama: ${err.message}\n`);
      }
      chatLoop();
    }
  };

  chatLoop();
}

async function main() {
  // Kick off Model GPU pre-load in the background simultaneously
  const modelLoadPromise = preloadModelToGPU();

  // Perform IO/Auth bound tasks without waiting for GPU load
  const gmail = await authenticateGmail();
  const context = await fetchLatestEmails(gmail);

  // Guarantee model has finished loading before starting interactive chat
  await modelLoadPromise;
  await startChat(context);
}

// Trap Sigint
rl.on('SIGINT', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});

main();
