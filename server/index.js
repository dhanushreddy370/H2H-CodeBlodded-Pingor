const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initHeartbeat, syncThreads } = require('./services/syncService');
const { readDB } = require('./services/dbService');
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

app.use('/api/tasks', tasksRoute);
app.use('/api/followups', followupsRoute);
app.use('/api/filters', filtersRoute);
app.use('/api/chat', chatRoute);
app.use('/api/history', historyRoute);

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
    await syncThreads();
    const db = readDB();
    const latestLog = db.syncLogs[db.syncLogs.length - 1];
    res.json({ success: true, log: latestLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize heartbeat
initHeartbeat();

// MongoDB features stripped in favor of local JSON DB

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
