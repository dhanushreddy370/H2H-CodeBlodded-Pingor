const axios = require('axios');
const OLLAMA_BASE = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.2:latest';
const OLLAMA_GENERATE_URL = `${OLLAMA_BASE}/api/generate`;

async function test() {
  console.log(`Testing ${OLLAMA_MODEL} at ${OLLAMA_GENERATE_URL}...`);
  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: 'say hello',
      stream: false
    });
    console.log('Success:', response.data.response);
  } catch (err) {
    console.error('Failed:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
  }
}

test();
