const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { initHeartbeat } = require('./services/syncService');
const Thread = require('./models/Thread');
const SyncLog = require('./models/SyncLog');

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

app.use('/api/tasks', tasksRoute);
app.use('/api/followups', followupsRoute);
app.use('/api/filters', filtersRoute);
app.use('/api/chat', chatRoute);

// API endpoint to fetch sync status and latest threads
app.get('/api/sync/status', async (req, res) => {
  try {
    const latestLog = await SyncLog.findOne().sort({ executionTime: -1 });
    const latestThreads = await Thread.find().sort({ lastUpdated: -1 }).limit(10);
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

// Initialize heartbeat
initHeartbeat();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
