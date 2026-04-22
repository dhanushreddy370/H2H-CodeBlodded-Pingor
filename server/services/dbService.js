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
      users: [],
      actionItems: [],
      threads: [],
      chatSessions: [],
      syncLogs: [],
      filters: [],
      contacts: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialSchema, null, 2));
  }
};

const readDB = () => {
  initDB();
  const rawData = fs.readFileSync(DB_PATH, 'utf8');
  const emptySchema = {
    users: [],
    actionItems: [],
    threads: [],
    chatSessions: [],
    syncLogs: [],
    filters: [],
    contacts: []
  };

  try {
    const data = JSON.parse(rawData);
    // Ensure all keys exist
    return { ...emptySchema, ...data };
  } catch (err) {
    console.error("DB file corrupted, returning empty schema:", err);
    return emptySchema;
  }
};

const writeDB = async (data) => {
  await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2));
};

module.exports = {
  initDB,
  readDB,
  writeDB
};
