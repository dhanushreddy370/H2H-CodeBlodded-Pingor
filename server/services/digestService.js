const { readDB } = require('./dbService');
const { differenceInDays } = require('./threadUtils');

const formatDate = (value) => {
  if (!value) return 'No date';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const buildDigest = (userId) => {
  const db = readDB();
  const threads = (db.threads || []).filter((thread) => thread.userId === userId);
  const tasks = (db.actionItems || []).filter((task) => task.userId === userId);

  const openTasks = tasks.filter((task) => task.status !== 'done');
  const urgentTasks = openTasks.filter((task) => (task.priority || 0) >= 4);
  const followUps = threads
    .filter((thread) => thread.needsFollowUp || thread.draftStatus === 'pending_approval')
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 8);
  const todaysHighlights = threads
    .slice()
    .sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt))
    .slice(0, 8);

  const overview = [
    `Threads analyzed: ${threads.length}`,
    `Open tasks: ${openTasks.length}`,
    `Urgent tasks: ${urgentTasks.length}`,
    `Follow-ups due: ${followUps.filter((thread) => thread.needsFollowUp).length}`
  ];

  const markdown = [
    '# Daily Digest',
    '',
    `Generated: ${new Date().toLocaleString('en-US')}`,
    '',
    '## Overview',
    ...overview.map((line) => `- ${line}`),
    '',
    '## Critical Actions',
    ...(urgentTasks.length > 0
      ? urgentTasks.slice(0, 8).map((task) => `- [P${task.priority || 3}] ${task.action || task.subject || 'Untitled task'}${task.deadline ? ` — due ${formatDate(task.deadline)}` : ''}`)
      : ['- No urgent tasks right now.']),
    '',
    '## Follow-ups Waiting On You',
    ...(followUps.length > 0
      ? followUps.map((thread) => {
          const age = differenceInDays(thread.lastInboundAt || thread.lastUpdated);
          return `- [P${thread.priority || 3}] ${thread.subject || 'Untitled thread'} — ${thread.sender || 'Unknown sender'}${age !== null ? ` — waiting ${age} day${age === 1 ? '' : 's'}` : ''}`;
        })
      : ['- No follow-ups currently overdue.']),
    '',
    '## Recent Highlights',
    ...(todaysHighlights.length > 0
      ? todaysHighlights.map((thread) => `- ${thread.subject || 'Untitled thread'} — ${thread.aiSummary || thread.snippet || 'No summary available.'}`)
      : ['- No recent threads available.'])
  ].join('\n');

  return {
    title: 'Daily Digest',
    generatedAt: new Date().toISOString(),
    overview,
    urgentTasks: urgentTasks.slice(0, 8),
    followUps,
    highlights: todaysHighlights,
    markdown
  };
};

module.exports = {
  buildDigest
};
