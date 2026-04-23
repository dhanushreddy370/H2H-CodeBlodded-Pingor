const { readDB, writeDB } = require('./dbService');
const { buildThreadState } = require('./threadUtils');

const senderProfiles = [
  { name: 'Ravi Menon', email: 'ravi@finloop.ai', categoryTag: 'approval-pending', subjects: ['Budget review for Q2', 'Need approval on cloud spend', 'Updated forecast for next sprint'], snippet: 'Sharing the latest budget numbers. Can you review and confirm by tomorrow?', priority: 5 },
  { name: 'Priya Sharma', email: 'priya@acmecorp.com', categoryTag: 'meeting-related', subjects: ['Design review follow-up', 'Sprint planning notes', 'Can we lock tomorrow morning for a review?'], snippet: 'Following up on the discussion from earlier. Need your response before we finalize the deck.', priority: 4 },
  { name: 'Alex from Northwind', email: 'alex@northwind-vendors.com', categoryTag: 'vendor/external', subjects: ['Invoice overdue reminder', 'Contract redlines attached', 'Vendor onboarding checklist'], snippet: 'Checking in on the pending invoice and contract approval. Let us know your timeline.', priority: 4 },
  { name: 'Campus Recruiter', email: 'recruiting@talentforge.io', categoryTag: 'personal', subjects: ['Candidate shortlist for review', 'Recruiting sync notes', 'Interview feedback reminder'], snippet: 'Can you review these candidate notes and send feedback when you get a moment?', priority: 3 },
  { name: 'Support Team', email: 'customer-success@productlane.app', categoryTag: 'action-required', subjects: ['Customer onboarding issue', 'Need help on enterprise setup', 'Escalated customer question'], snippet: 'A customer is blocked on onboarding and is waiting for your response.', priority: 5 },
  { name: 'Google Workspace', email: 'workspace-noreply@google.com', categoryTag: 'FYI/informational', subjects: ['Your monthly security digest', 'Workspace feature update', 'Admin summary for this week'], snippet: 'Here is your weekly summary and feature rollup. No action is required.', priority: 1 },
  { name: 'Internal Ops', email: 'ops@pingor.dev', categoryTag: 'action-required', subjects: ['Need input on launch checklist', 'Hackathon demo runthrough', 'Action items from standup'], snippet: 'Can you update the launch checklist and confirm the outstanding tasks?', priority: 4 },
  { name: 'Legal Counsel', email: 'legal@clearpath.law', categoryTag: 'approval-pending', subjects: ['MSA revision pending approval', 'Need signature on NDA', 'Compliance review for data policy'], snippet: 'Please review the attached legal revision and confirm if we can proceed.', priority: 4 }
];

const createSyntheticThreads = async ({ userId, userEmail, totalThreads = 120 }) => {
  const db = readDB();
  if (!db.threads) db.threads = [];
  if (!db.actionItems) db.actionItems = [];

  const existingSyntheticIds = new Set((db.threads || []).filter((thread) => thread.synthetic).map((thread) => thread.threadId));

  for (let index = 0; index < totalThreads; index += 1) {
    const profile = senderProfiles[index % senderProfiles.length];
    const dayOffset = index % 14;
    const needsReply = index % 3 !== 0;
    const lastInboundAt = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000 - (index % 6) * 60 * 60 * 1000).toISOString();
    const lastOutboundAt = needsReply ? null : new Date(Date.now() - Math.max(dayOffset - 1, 0) * 24 * 60 * 60 * 1000).toISOString();
    const subject = profile.subjects[index % profile.subjects.length];
    const threadId = `synthetic-thread-${index + 1}`;

    if (existingSyntheticIds.has(threadId)) continue;

    const baseThread = {
      _id: `thread-${threadId}`,
      threadId,
      synthetic: true,
      subject,
      snippet: profile.snippet,
      content: `${profile.snippet}\n\nSynthetic demo thread ${index + 1} generated for hackathon showcase.`,
      aiSummary: profile.snippet,
      categoryTag: profile.categoryTag,
      priority: profile.priority - (index % 2 === 0 ? 0 : 1),
      sender: `${profile.name} <${profile.email}>`,
      sourceEmail: profile.email,
      userId,
      status: 'open',
      createdAt: lastInboundAt,
      updatedAt: lastInboundAt,
      lastInboundAt,
      lastOutboundAt,
      lastMessageAt: needsReply ? lastInboundAt : lastOutboundAt,
      lastDirection: needsReply ? 'inbound' : 'outbound'
    };

    const threadState = buildThreadState({
      messages: [],
      existingThread: baseThread,
      userEmail
    });

    const thread = {
      ...baseThread,
      ...threadState
    };

    db.threads.push(thread);

    if (thread.categoryTag === 'action-required') {
      db.actionItems.push({
        _id: `task-${threadId}`,
        threadId,
        userId,
        synthetic: true,
        action: subject,
        owner: 'user',
        deadline: index % 4 === 0 ? new Date(Date.now() + (index % 5 + 1) * 24 * 60 * 60 * 1000).toISOString() : null,
        priority: thread.priority,
        sender: thread.sender,
        sourceEmail: thread.sourceEmail,
        status: 'pending',
        updatedAt: thread.updatedAt
      });
    }
  }

  await writeDB(db);
  return {
    threads: (db.threads || []).filter((thread) => thread.synthetic && thread.userId === userId).length,
    tasks: (db.actionItems || []).filter((task) => task.synthetic && task.userId === userId).length
  };
};

module.exports = {
  createSyntheticThreads
};
