const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  picture: { type: String },
  jobRole: { type: String, default: '' },
  company: { type: String, default: '' },
  settings: {
    darkMode: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    syncFrequency: { type: String, default: '30' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
