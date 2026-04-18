const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Classify a thread using local Ollama instance
 * @param {string} subject 
 * @param {string} snippet 
 * @returns {Promise<string>} The classification tag
 */
async function classifyThread(subject, snippet) {
  const prompt = `
You are a locally-hosted, privacy-first AI assistant. Your data processing is strictly local.
Your task is to classify an email thread into exactly one of the following tags:
- action-required
- FYI/informational
- meeting-related
- approval-pending
- vendor/external
- personal

Email Subject: ${subject}
Email Snippet: ${snippet}

Respond ONLY with a valid JSON object in the following format:
{
  "tag": "action-required"
}
Do not include any explanation, markdown formatting, or extra text.
`;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    const responseText = response.data.response;
    let parsed;
    try {
      // Handle potential markdown wrapper or non-deterministic junk
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         parsed = JSON.parse(jsonMatch[0]);
      } else {
         parsed = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Ollama JSON response:', responseText);
      return 'unclassified';
    }

    const validTags = ['action-required', 'FYI/informational', 'meeting-related', 'approval-pending', 'vendor/external', 'personal'];
    if (parsed && validTags.includes(parsed.tag)) {
      return parsed.tag;
    }

    return 'unclassified';
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
       console.error('Ollama connection refused. Is the local AI running?');
    } else {
       console.error('Error communicating with Ollama:', error.message);
    }
    throw error;
  }
}

module.exports = {
  classifyThread
};
