const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { parseEmailAddress, stripDisplayName } = require('../services/threadUtils');

const dedupeSuggestions = (entries = []) => {
  const seen = new Map();
  entries.forEach((entry) => {
    if (!entry.email) return;
    const key = entry.email.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, {
        _id: entry._id || entry.id || key,
        name: entry.name || entry.email,
        email: entry.email,
        source: entry.source || 'contact'
      });
    }
  });
  return [...seen.values()];
};

// Get all contacts for a user
router.get('/', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'UserId is required' });
    
    const db = readDB();
    const contacts = (db.contacts || []).filter(c => c.userId === userId);
    
    // Sort by name
    contacts.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/suggestions', (req, res) => {
  try {
    const { userId, q = '' } = req.query;
    if (!userId) return res.status(400).json({ error: 'UserId is required' });

    const db = readDB();
    const normalizedQuery = String(q).trim().toLowerCase();

    const contacts = (db.contacts || [])
      .filter((contact) => contact.userId === userId)
      .map((contact) => ({ ...contact, source: 'contact' }));

    const users = (db.users || [])
      .filter((entry) => (entry.userId || entry.id || entry.sub || entry.email) !== userId)
      .map((entry) => ({
        _id: entry._id || entry.id || entry.userId || entry.email,
        name: entry.name || entry.email,
        email: entry.email,
        source: 'user'
      }));

    const senders = (db.threads || [])
      .filter((thread) => thread.userId === userId)
      .map((thread) => ({
        _id: thread._id || thread.threadId || parseEmailAddress(thread.sender || ''),
        name: stripDisplayName(thread.sender || ''),
        email: parseEmailAddress(thread.sender || '') || thread.sourceEmail || '',
        source: 'mail'
      }));

    const ranked = dedupeSuggestions([...contacts, ...users, ...senders])
      .filter((entry) => {
        if (!normalizedQuery) return true;
        const haystack = `${entry.name} ${entry.email} ${entry.source}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const aExact = normalizedQuery && (`${a.name} ${a.email}`.toLowerCase().startsWith(normalizedQuery) ? 1 : 0);
        const bExact = normalizedQuery && (`${b.name} ${b.email}`.toLowerCase().startsWith(normalizedQuery) ? 1 : 0);
        if (bExact !== aExact) return bExact - aExact;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, userId } = req.body;
    if (!name || !email || !userId) {
      return res.status(400).json({ error: 'Name, Email, and UserId are compulsory' });
    }
    
    const db = readDB();
    if (!db.contacts) db.contacts = [];

    const newContact = {
      _id: `contact-${Date.now()}`,
      name,
      email,
      phone: phone || '',
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.contacts.push(newContact);
    await writeDB(db);
    
    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a contact
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const index = (db.contacts || []).findIndex(c => c._id === id);
    
    if (index === -1) return res.status(404).json({ error: 'Contact not found' });
    
    db.contacts[index] = {
      ...db.contacts[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeDB(db);
    res.json(db.contacts[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const initialLength = (db.contacts || []).length;
    
    db.contacts = (db.contacts || []).filter(c => c._id !== id);
    
    if (db.contacts.length === initialLength) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    await writeDB(db);
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
