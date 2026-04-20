const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Initialize database if it doesn't exist
const initDB = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialSchema = {
      actionItems: [],
      threads: [],
      chatSessions: [],
      syncLogs: [],
      filters: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialSchema, null, 2));
  }
};

const readDB = () => {
  initDB();
  const rawData = fs.readFileSync(DB_PATH, 'utf8');
  try {
    return JSON.parse(rawData);
  } catch (err) {
    console.error("DB file corrupted, returning empty schema:", err);
    return {
      actionItems: [],
      threads: [],
      chatSessions: [],
      syncLogs: [],
      filters: []
    };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

module.exports = {
  initDB,
  readDB,
  writeDB
};
