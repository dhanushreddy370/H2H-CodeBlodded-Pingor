const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma:2b';

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
 * Assign a priority score (1-5) to a thread
 * @param {string} subject
 * @param {string} snippet
 * @returns {Promise<number>} Priority 1-5
 */
async function assignPriority(subject, snippet) {
  const prompt = `
You are a locally-hosted AI assistant.
Your task is to assign a priority score from 1 to 5 to the following email thread, where 1 is lowest priority and 5 is highest priority.
High priority goes to urgent actions, final approvals, deadlines.
Low priority goes to newsletters, general FYI, casual personal notes.

Email Subject: ${subject}
Email Snippet: ${snippet}

Respond ONLY with a valid JSON object in the following format:
{
  "priority": 3
}
Do not include any explanation.
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
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      if (parsed && typeof parsed.priority === 'number') {
        const p = Math.max(1, Math.min(5, parsed.priority));
        return p;
      }
    } catch (e) {
      console.error('Failed to parse Ollama JSON response for priority:', responseText);
    }
  } catch (err) {
    console.error('Error with assignPriority:', err.message);
  }
  return 3; // Default priority
}

/**
 * Takes a user prompt and generates a MongoDB-compatible query object
 * @param {string} userPrompt
 * @returns {Promise<Object>} MongoDB Query
 */
async function generateFilterQuery(userPrompt) {
  const prompt = `
You are a locally-hosted AI assistant.
Your task is to generate a MongoDB query object based on the user's string prompt.
Available fields for querying in Thread/ActionItem collections:
- status (e.g. 'open', 'done', 'pending')
- priority (number 1-5, higher is more important)
- type (string)
- sender (string)
- subject (string - you can use $regex with $options: 'i')
- snippet (string - you can use $regex with $options: 'i')

Example: "Only show emails related to the Project X audit"
Output: { "subject": { "$regex": "Project X audit", "$options": "i" } }

Another example: "Show me high priority items from Alice"
Output: { "priority": { "$gte": 4 }, "sender": { "$regex": "Alice", "$options": "i" } }

User Prompt: "${userPrompt}"

Respond ONLY with a valid JSON object representing the MongoDB query. Do not include any explanations or markdown.
`;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
  } catch (err) {
    console.error('Error generating filter query:', err.message);
    return {};
  }
}

/**
 * Extract action items from an email thread
 * @param {string} threadId 
 * @param {string} subject 
 * @param {string} snippet 
 * @returns {Promise<Array>} List of action items
 */
async function extractActionItems(threadId, subject, snippet) {
  const prompt = `
Analyze the following email and extract specific, actionable tasks.
Subject: ${subject}
Snippet: ${snippet}

Return a JSON array of objects, each with:
- action: A concise description of the task
- owner: Who is responsible (if known, else 'user')
- deadline: 'none' or an ISO date if mentioned
- source_email: The subject line of the email

JSON format only. No extra text.
`;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const actions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    return Array.isArray(actions) ? actions : [];
  } catch (err) {
    console.error('Error extracting action items:', err.message);
    return [];
  }
}

/**
 * Evaluate if an FYI email needs a quick acknowledgement
 * @param {string} subject 
 * @param {string} snippet 
 * @returns {Promise<Object>}
 */
async function evaluateAcknowledgement(subject, snippet) {
  const prompt = `
Is the following email just an informational update (FYI) that would benefit from a polite, professional acknowledgement?
Subject: ${subject}
Snippet: ${snippet}

Respond with a JSON object:
{
  "isInformational": true/false,
  "draftReply": "A one-sentence professional reply or null"
}
`;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { isInformational: false, draftReply: null };
  } catch (err) {
    console.error('Error evaluating acknowledgement:', err.message);
    return { isInformational: false, draftReply: null };
  }
}

/**
 * Generate a full chat response using local Ollama llama3.2
 * @param {Array} messages - Array of {role, content} objects
 * @returns {Promise<string>} The generated response text
 */
async function generateChatResponse(messages) {
  try {
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: OLLAMA_MODEL,
      messages: messages,
      stream: false
    });

    return response.data.message.content;
  } catch (error) {
    console.error('Error with generateChatResponse:', error.message);
    return "I'm sorry, my local brain (Ollama) is currently unreachable. Please ensure it's running with gemma:2b.";
  }
}

module.exports = {
  classifyThread,
  assignPriority,
  generateFilterQuery,
  generateChatResponse,
  extractActionItems,
  evaluateAcknowledgement
};
