const mongoose = require('mongoose');

const filterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  naturalLanguagePrompt: { type: String, required: true },
  mongoQuery: { type: mongoose.Schema.Types.Mixed, required: true }, // Store the parsed JSON query
}, { timestamps: true });

module.exports = mongoose.model('Filter', filterSchema);
