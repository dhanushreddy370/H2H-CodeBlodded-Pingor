const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initHeartbeat, syncThreads, getSyncProgress } = require('./services/syncService');
const { readDB } = require('./services/dbService');
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
  res.send('Pingor Server is Running');
});

// Import Routes
const tasksRoute = require('./routes/tasks');
const followupsRoute = require('./routes/followups');
const filtersRoute = require('./routes/filters');
const chatRoute = require('./routes/chat');
const historyRoute = require('./routes/history');
const threadsRoute = require('./routes/threads');
const authRoute = require('./routes/auth');

app.use('/api/tasks', tasksRoute);
app.use('/api/followups', followupsRoute);
app.use('/api/filters', filtersRoute);
app.use('/api/chat', chatRoute);
app.use('/api/history', historyRoute);
app.use('/api/threads', threadsRoute);
app.use('/api/auth', authRoute);

// API endpoint to fetch sync status and latest threads
// API endpoint to fetch sync status and latest threads
app.get('/api/sync/status', async (req, res) => {
  try {
    const db = readDB();
    const sortedSyncs = [...db.syncLogs].sort((a, b) => new Date(b.executionTime) - new Date(a.executionTime));
    const latestLog = sortedSyncs[0];
    
    const latestThreads = [...db.threads]
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, 10);
      
    res.json({
      status: latestLog ? latestLog.status : 'No syncs yet',
      lastSync: latestLog ? latestLog.executionTime : null,
      latestLog,
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

// MongoDB features stripped in favor of local JSON DB

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
