const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');

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
