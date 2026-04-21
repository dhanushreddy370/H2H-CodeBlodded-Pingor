const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  threadId: { type: String, required: true, unique: true },
  subject: { type: String },
  sender: { type: String },
  snippet: { type: String },
  lastUpdated: { type: Date, default: Date.now },
  priority: { type: Number, default: 3 },
  status: { type: String, enum: ['open', 'done', 'ignored'], default: 'open' },
  aiSummary: { type: String },
  aiResponse: { type: String },
  draftStatus: { type: String, enum: ['none', 'pending_approval', 'approved', 'rejected'], default: 'none' },
  archived: { type: Boolean, default: false },
  trashed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thread', threadSchema);
