const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  threadId: { type: String, required: true, unique: true },
  subject: { type: String },
  snippet: { type: String },
  categoryTag: { type: String }, // AI-generated category tag
  lastUpdated: { type: Date, default: Date.now },
  priority: { type: Number, default: 3 },
  status: { type: String, default: 'open' },
  type: { type: String },
  sender: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Thread', threadSchema);
