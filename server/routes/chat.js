const express = require('express');
const router = express.Router();
const { initAgent } = require('../agents/agentService');
const { readDB, writeDB } = require('../services/dbService');

// Context Injection Endpoint
router.post('/context', (req, res) => {
  try {
    const { taskIds = [], followUpIds = [] } = req.body;
    let contextParts = [];
    const db = readDB();

    if (taskIds.length > 0) {
      const tasks = (db.actionItems || []).filter(t => taskIds.includes(t._id));
      if (tasks.length > 0) {
        contextParts.push('--- RELEVANT TASKS ---');
        tasks.forEach(t => {
          contextParts.push(`Task: ${t.action}\nStatus: ${t.status}\nPriority: P${t.priority}\nDeadline: ${t.deadline || 'None'}`);
        });
      }
    }

    if (followUpIds.length > 0) {
      const threads = (db.threads || []).filter(th => followUpIds.includes(th._id));
      if (threads.length > 0) {
        contextParts.push('--- RELEVANT EMAIL THREADS ---');
        threads.forEach(th => {
          contextParts.push(`Subject: ${th.subject}\nSender: ${th.sender}\nSnippet: ${th.snippet}`);
        });
      }
    }

    res.json({ contextBlock: contextParts.join('\n\n') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real Agentic Chat Endpoint
router.post('/ask', async (req, res) => {
  try {
    const { messages, userId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for agentic chat.' });
    }

    // 1. Initialize the LangChain agent for this specific user
    const agent = await initAgent(userId);
    
    // 2. Prepare history and last message
    const lastMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'human' : 'ai',
      content: m.content
    }));

    // 3. Invoke the agent
    console.log(`[CHAT] Invoking agent for user ${userId}...`);
    const result = await agent.invoke({
      input: lastMessage,
      chat_history: history
    });

    const aiText = result.output;
    
    // 4. Persistence: Save to chatSessions in JSON DB
    const db = readDB();
    if (!db.chatSessions) db.chatSessions = [];
    
    let sessionIndex = db.chatSessions.findIndex(s => s.userId === userId && s.status === 'active');
    
    if (sessionIndex === -1) {
      const newSession = {
        _id: `chat-${Date.now()}`,
        userId,
        title: lastMessage.substring(0, 40) + (lastMessage.length > 40 ? '...' : ''),
        messages: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.chatSessions.push(newSession);
      sessionIndex = db.chatSessions.length - 1;
    }

    // Append messages to history
    db.chatSessions[sessionIndex].messages.push({
      role: 'user',
      content: lastMessage,
      timestamp: new Date().toISOString()
    });
    db.chatSessions[sessionIndex].messages.push({
      role: 'assistant',
      content: aiText,
      timestamp: new Date().toISOString()
    });
    db.chatSessions[sessionIndex].updatedAt = new Date().toISOString();

    await writeDB(db);

    res.json({ text: aiText });
  } catch (err) {
    console.error('Agentic Chat Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
