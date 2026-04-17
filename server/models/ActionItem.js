const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  action: { type: String, required: true },
  owner: { type: String },
  deadline: { type: Date },
  source_email: { type: String, required: true }, // e.g., threadId or messageId
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('ActionItem', actionItemSchema);
