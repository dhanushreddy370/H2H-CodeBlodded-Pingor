const mongoose = require('mongoose');

const filterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  queryPrompt: { type: String, required: true },
  mongoQuery: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Filter', filterSchema);
