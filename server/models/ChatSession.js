const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, default: 'New Chat' },
  messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
