const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/dbService');
const { sendTaskAssignmentEmail } = require('../services/gmailService');

const getIdentity = (value = {}) => value.userId || value.id || value.sub || value.email || null;

const normalizeAssignees = (assignees = []) => (
  (Array.isArray(assignees) ? assignees : [])
    .filter((entry) => entry && entry.email)
    .map((entry) => ({
      _id: entry._id || entry.id || entry.email,
      name: entry.name || entry.email,
      email: String(entry.email).trim().toLowerCase()
    }))
);

const notifyNewAssignees = async ({ actorUserId, task, previousAssignees = [] }) => {
  const existingEmails = new Set(normalizeAssignees(previousAssignees).map((entry) => entry.email));
  const nextAssignees = normalizeAssignees(task.assignees);
  const recipients = nextAssignees.filter((entry) => !existingEmails.has(entry.email));

  if (!actorUserId || recipients.length === 0) {
    return { notifiedCount: 0, failures: [] };
  }

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendTaskAssignmentEmail({
        assignerUserId: actorUserId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        task
      })
    )
  );

  const failures = results
    .map((result, index) => ({ result, recipient: recipients[index] }))
    .filter(({ result }) => result.status === 'rejected' || result.value === false)
    .map(({ recipient }) => recipient.email);

  return {
    notifiedCount: recipients.length - failures.length,
    failures
  };
};

router.get('/', (req, res) => {
  try {
    const { deadline, userId, status, priority } = req.query;
    const db = readDB();
    const actionItems = db.actionItems || [];

    let filtered = actionItems;
    if (userId && userId !== 'undefined') {
      filtered = actionItems.filter((item) =>
        item.userId === userId || item.userId === 'test-user-id' || !item.userId
      );
    }

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }

    filtered.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;

      if (priority === 'asc') return (a.priority || 3) - (b.priority || 3);
      if (priority === 'desc') return (b.priority || 3) - (a.priority || 3);

      if (deadline === 'asc') return new Date(a.deadline || '9999') - new Date(b.deadline || '9999');
      if (deadline === 'desc') return new Date(b.deadline || '1970') - new Date(a.deadline || '1970');

      return (a.priority || 3) - (b.priority || 3);
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = readDB();
    if (!db.actionItems) db.actionItems = [];

    const actorUserId = getIdentity(req.body);
    if (!actorUserId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!(req.body.action || req.body.subject || req.body.title)) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const newTask = {
      _id: `task-${Date.now()}`,
      ...req.body,
      userId: actorUserId,
      assignees: normalizeAssignees(req.body.assignees),
      status: req.body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.actionItems.push(newTask);
    await writeDB(db);

    const notificationStatus = await notifyNewAssignees({
      actorUserId,
      task: newTask
    });

    res.status(201).json({ ...newTask, notificationStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const db = readDB();
    const index = (db.actionItems || []).findIndex((task) => task._id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Task not found' });

    const previousTask = db.actionItems[index];
    const nextTask = {
      ...previousTask,
      ...req.body,
      assignees: req.body.assignees ? normalizeAssignees(req.body.assignees) : previousTask.assignees,
      updatedAt: new Date().toISOString()
    };

    db.actionItems[index] = nextTask;
    await writeDB(db);

    const notificationStatus = await notifyNewAssignees({
      actorUserId: getIdentity(req.body) || previousTask.userId,
      task: nextTask,
      previousAssignees: previousTask.assignees
    });

    res.json({ ...nextTask, notificationStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const db = readDB();
    const index = (db.actionItems || []).findIndex((task) => task._id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Task not found' });

    db.actionItems[index].status = status;
    db.actionItems[index].updatedAt = new Date().toISOString();

    await writeDB(db);
    res.json(db.actionItems[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
