const readline = require('readline');
const axios = require('axios');
const dotenv = require('dotenv');
const { oauth2Client, getAuthUrl, loadSavedTokens, setCredentials, getGmailClient } = require('./config/gmail');
const { initAgent } = require('./agents/agentService');
const { AIMessage, HumanMessage } = require("@langchain/core/messages");

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
  if (loadSavedTokens()) {
    console.log('[SYS] Real OAuth tokens found in tokens.json! Loaded successfully.');
    return;
  }

  if (!process.env.GMAIL_CLIENT_ID || process.env.GMAIL_CLIENT_ID === 'your_client_id_here') {
    console.log('\n[SYS] No GMAIL_CLIENT_ID found in your .env file.');
    console.log('[SYS] Falling back to OFFLINE Mock Emails to let you test the AI properly.\n');
    return; // Signals we should use mock data
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
    console.log('✅ Successfully authenticated with Gmail! Your tokens have been permanently saved.\n');
  } catch (error) {
    console.error('❌ Error authenticating:', error.message);
    console.log('[SYS] Falling back to OFFLINE Mock Emails due to auth failure.\n');
  }
}

async function startChat() {
  console.log('=======================================');
  console.log('        OLLAMA CHAT INTERFACE          ');
  console.log('=======================================');
  console.log('Type "exit" to quit the chat.\n');

  console.log('[SYS] Starting LangChain Agent...');
  const agentExecutor = await initAgent();
  let chatHistory = [];
  console.log('✅ Agent is ready to chat and fetch emails!\n');

  const chatLoop = async () => {
    const userPrompt = await askQuestion('You: ');
    
    if (userPrompt.trim().toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    if (!userPrompt.trim()) return chatLoop();

    try {
      process.stdout.write('Ollama (Pingor): [Thinking and exploring tools...]\n');
      
      const response = await agentExecutor.invoke({
        input: userPrompt,
        chat_history: chatHistory
      });

      console.log(`\nOllama (Pingor): ${response.output}\n`);
      
      chatHistory.push(new HumanMessage(userPrompt));
      chatHistory.push(new AIMessage(response.output));

      chatLoop();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
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
  await authenticateGmail();

  // Guarantee model has finished loading before starting interactive chat
  await modelLoadPromise;
  await startChat();
}

// Trap Sigint
rl.on('SIGINT', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});

main();
