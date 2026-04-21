const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  deadline: { type: Date },
  priority: { type: Number, default: 3 },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  sender: { type: String },
  threadId: { type: String },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    text: { type: String, required: true },
    author: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
