const axios = require('axios');

// Configure from .env
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

const OLLAMA_GENERATE_URL = `${OLLAMA_BASE}/api/generate`;
const OLLAMA_CHAT_URL = `${OLLAMA_BASE}/api/chat`;

/**
 * Classify a thread using local Ollama instance
 */
async function classifyThread(subject, snippet) {
  const prompt = `
You are a locally-hosted AI assistant.
Classify this email thread into one of: action-required, FYI/informational, meeting-related, approval-pending, vendor/external, personal.

Subject: ${subject}
Snippet: ${snippet}

Respond ONLY with valid JSON: { "tag": "tag-name" }
`;

  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    }, {
      timeout: OLLAMA_TIMEOUT
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    const validTags = ['action-required', 'FYI/informational', 'meeting-related', 'approval-pending', 'vendor/external', 'personal'];
    return (parsed && validTags.includes(parsed.tag)) ? parsed.tag : 'unclassified';
  } catch (error) {
    console.error('Ollama classification failed:', error.message);
    throw error;
  }
}

/**
 * Assign a priority score (1-5) to a thread
 */
async function assignPriority(subject, snippet) {
  const prompt = `
Assign a priority (1-5) to this email. 1=newsletters, 5=urgent deadlines.
Subject: ${subject}
Snippet: ${snippet}
Respond ONLY with JSON: { "priority": 3 }
`;

  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    }, {
      timeout: OLLAMA_TIMEOUT
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    return (parsed && typeof parsed.priority === 'number') ? Math.max(1, Math.min(5, parsed.priority)) : 3;
  } catch (err) {
    return 3;
  }
}

/**
 * Generate a full chat response using local Ollama
 */
async function generateChatResponse(messages) {
  try {
    const response = await axios.post(OLLAMA_CHAT_URL, {
      model: OLLAMA_MODEL,
      messages: messages,
      stream: false
    });

    return response.data.message.content;
  } catch (error) {
    console.error('generateChatResponse failed:', error.message);
    return `I'm sorry, my local brain (${OLLAMA_MODEL}) is currently unreachable at ${OLLAMA_BASE}. Please ensure Ollama is running.`;
  }
}

/**
 * Extract action items from an email thread
 */
async function extractActionItems(threadId, subject, snippet) {
  const prompt = `
Extract actionable tasks from this email.
Subject: ${subject}
Snippet: ${snippet}
Return a JSON array of objects: [{ "action": "...", "owner": "...", "deadline": "..." }]
`;

  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
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
    return [];
  }
}

/**
 * Generate a MongoDB query for search
 */
async function generateFilterQuery(userPrompt) {
  const prompt = `
You are a search assistant. Convert this natural language user prompt into a structured JSON filter for a local email thread database.
Prompt: "${userPrompt}"

Fields available:
- categoryTag (action-required, FYI/informational, meeting-related, approval-pending, vendor/external, personal)
- priority (integer 1-5, where 5 is highest)
- sender (name or email)
- subject (text search)
- snippet (text search)
- needsFollowUp (boolean)
- direction ("inbound" for received/inbox mail, "outbound" for sent mail)
- datePreset ("today" or "yesterday" when explicitly asked)
- dateWindowDays (integer, e.g., 7 for last week, 1 for today)

Respond ONLY with valid JSON. Example: { "categoryTag": "action-required", "minPriority": 4, "sender": "Ravi", "direction": "inbound", "dateWindowDays": 7 }
`;

  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (err) {
    return {};
  }
}

/**
 * Evaluate FYI emails
 */
async function evaluateAcknowledgement(subject, snippet) {
  const prompt = `
Should this email be acknowledged?
Subject: ${subject}
Snippet: ${snippet}
JSON: { "isInformational": true, "draftReply": "..." }
`;

  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { isInformational: false, draftReply: null };
  } catch (err) {
    return { isInformational: false, draftReply: null };
  }
}

/**
 * Generate a professional reply to an email thread
 */
async function generateReply(subject, snippet) {
  const prompt = `
Generate a professional, concise reply to this email.
Subject: ${subject}
Content: ${snippet}

Respond ONLY with the text of the reply. Keep it under 100 words.
`;

  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false
    });

    return response.data.response;
  } catch (error) {
    console.error('Ollama reply generation failed:', error.message);
    return "Thank you for your email. I will look into this and get back to you shortly.";
  }
}

/**
 * Generate a quick one-sentence insight for an email
 */
async function generateInsight(subject, snippet) {
  const prompt = `
Summarize the main intent of this email in EXACTLY one short sentence.
Subject: ${subject}
Content: ${snippet}
`;

  try {
    const response = await axios.post(OLLAMA_GENERATE_URL, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false
    });

    return response.data.response.trim();
  } catch (error) {
    return "No urgent insight required for this thread.";
  }
}

module.exports = {
  classifyThread,
  assignPriority,
  generateFilterQuery,
  generateChatResponse,
  extractActionItems,
  evaluateAcknowledgement,
  generateReply,
  generateInsight
};
