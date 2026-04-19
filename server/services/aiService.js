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
/**
 * Extract action items from a thread using local Ollama instance
 * @param {string} threadId
 * @param {string} subject 
 * @param {string} snippet 
 * @returns {Promise<Array>} List of action items
 */
async function extractActionItems(threadId, subject, snippet) {
  const prompt = `
You are a privacy-oriented AI assistant.
Your task is to extract action items from this email thread.

Email Subject: ${subject}
Email Snippet: ${snippet}

Strictly ensure no Personally Identifiable Information (PII) such as names, phone numbers, or email addresses is included in the extracted logs. Use generic terms like 'client', 'vendor', or 'team member' instead.

Respond ONLY with a valid JSON array of objects in the following format:
[
  {
    "action": "Description of the task without PII",
    "owner": "Person responsible without PII",
    "deadline": "YYYY-MM-DD or 'none'"
  }
]
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
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
         parsed = JSON.parse(jsonMatch[0]);
      } else {
         parsed = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Ollama JSON response for action extraction:', responseText);
      return [];
    }
    
    if (Array.isArray(parsed)) {
      // Append the source_email requirement
      return parsed.map(item => ({ ...item, source_email: threadId }));
    }
    return [];
  } catch (error) {
    console.error('Error communicating with Ollama (Action Extraction):', error.message);
    return [];
  }
}

/**
 * Evaluate if an email is purely informational and generate a draft reply.
 * @param {string} subject 
 * @param {string} snippet 
 * @returns {Promise<Object>} { isInformational: boolean, draftReply: string }
 */
async function evaluateAcknowledgement(subject, snippet) {
  const prompt = `
You are an AI assistant.
Evaluate if this email is purely informational and if a simple acknowledgement reply is appropriate.
If it is, generate a short draft reply (e.g., 'Thank you for the update.').

Email Subject: ${subject}
Email Snippet: ${snippet}

Respond ONLY with a valid JSON object in the following format:
{
  "isInformational": true or false,
  "draftReply": "Your draft reply here, or null if false"
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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         parsed = JSON.parse(jsonMatch[0]);
      } else {
         parsed = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Ollama JSON response for evaluateAcknowledgement:', responseText);
      return { isInformational: false, draftReply: null };
    }
    return parsed;
  } catch (error) {
    console.error('Error communicating with Ollama (evaluateAcknowledgement):', error.message);
    return { isInformational: false, draftReply: null };
  }
}

module.exports = {
  classifyThread,
  extractActionItems,
  evaluateAcknowledgement
};
