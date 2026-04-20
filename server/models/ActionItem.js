const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  action: { type: String, required: true },
  owner: { type: String },
  deadline: { type: Date },
  userId: { type: String },
  source_email: { type: String, required: true }, // e.g., threadId or messageId
  status: { type: String, default: 'pending' },
  priority: { type: Number, default: 3 },
  type: { type: String },
  sender: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ActionItem', actionItemSchema);
