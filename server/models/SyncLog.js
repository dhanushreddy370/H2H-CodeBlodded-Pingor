const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  executionTime: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], required: true },
  threadsFetched: { type: Number, default: 0 },
  threadsUpserted: { type: Number, default: 0 },
  durationMs: { type: Number, required: true },
  error: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);
