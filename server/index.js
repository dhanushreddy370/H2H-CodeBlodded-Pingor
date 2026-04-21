const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initHeartbeat, syncThreads, getSyncProgress } = require('./services/syncService');
const { loadSavedTokens } = require('./config/gmail');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Pingor Server is Running (JSON DB Mode)');
});

// Import Routes
const tasksRoute = require('./routes/tasks');
const followupsRoute = require('./routes/followups');
const filtersRoute = require('./routes/filters');
const chatRoute = require('./routes/chat');
const historyRoute = require('./routes/history');
const threadsRoute = require('./routes/threads');
const authRoute = require('./routes/auth');
const usersRoute = require('./routes/users');
const contactsRoute = require('./routes/contacts');

app.use('/api/tasks', tasksRoute);
app.use('/api/followups', followupsRoute);
app.use('/api/filters', filtersRoute);
app.use('/api/chat', chatRoute);
app.use('/api/history', historyRoute);
app.use('/api/threads', threadsRoute);
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/contacts', contactsRoute);

// API endpoint to fetch sync status and latest threads
app.get('/api/sync/status', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const { readDB } = require('./services/dbService');
    const db = readDB();
    
    // Filter threads for the user from local DB
    const latestThreads = (db.threads || [])
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt))
      .slice(0, 10);
      
    res.json({
      status: 'Ready (Offline)',
      threads: latestThreads
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync/manual', async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    await syncThreads(userId);
    res.json({ success: true, message: 'Sync triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sync/progress', (req, res) => {
  res.json(getSyncProgress());
});

// Load saved tokens if any
loadSavedTokens();

// Initialize heartbeat
initHeartbeat();

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (IPv4 force)`);
});
