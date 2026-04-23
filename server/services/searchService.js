const { readDB } = require('./dbService');
const { parseEmailAddress } = require('./threadUtils');

const DEMO_QUERIES = [
  'find all emails from Ravi about the budget where I have not responded yet',
  'show me urgent vendor emails from the last week',
  'which meeting threads need my reply',
  'find approval pending threads from finance',
  'show newsletters and FYI emails from today',
  'emails from customers about onboarding',
  'high priority emails from recruiters',
  'what threads mention invoices or payment and are still open'
];

const senderDirectory = [
  'ravi', 'priya', 'alex', 'finance', 'hr', 'vendor', 'customer', 'recruiter', 'manager', 'ops'
];

const inferPromptFilters = (prompt = '') => {
  const normalized = prompt.toLowerCase();
  const filters = {
    categories: [],
    minPriority: null,
    senderIncludes: [],
    subjectIncludes: [],
    needsFollowUp: false,
    dateWindowDays: null
  };

  if (normalized.includes('not responded') || normalized.includes('have not responded') || normalized.includes('waiting on me')) {
    filters.needsFollowUp = true;
  }

  if (normalized.includes('urgent') || normalized.includes('critical')) {
    filters.minPriority = 4;
  }

  if (normalized.includes('last week') || normalized.includes('past week')) {
    filters.dateWindowDays = 7;
  } else if (normalized.includes('today')) {
    filters.dateWindowDays = 1;
  } else if (normalized.includes('last month')) {
    filters.dateWindowDays = 30;
  }

  const categoryMap = [
    ['action-required', ['action required', 'action-required', 'task']],
    ['FYI/informational', ['fyi', 'informational', 'newsletter']],
    ['meeting-related', ['meeting']],
    ['approval-pending', ['approval', 'approve']],
    ['vendor/external', ['vendor', 'external']],
    ['personal', ['personal']]
  ];

  categoryMap.forEach(([category, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      filters.categories.push(category);
    }
  });

  senderDirectory.forEach((sender) => {
    if (normalized.includes(sender)) {
      filters.senderIncludes.push(sender);
    }
  });

  ['budget', 'invoice', 'payment', 'onboarding', 'approval', 'product hunt', 'candidate', 'finance'].forEach((term) => {
    if (normalized.includes(term)) {
      filters.subjectIncludes.push(term);
    }
  });

  return filters;
};

const executeSearch = ({ userId, prompt }) => {
  const db = readDB();
  const threads = (db.threads || []).filter((thread) => thread.userId === userId);
  const filters = inferPromptFilters(prompt);
  const now = Date.now();

  const results = threads.filter((thread) => {
    if (filters.minPriority && (thread.priority || 0) < filters.minPriority) {
      return false;
    }

    if (filters.needsFollowUp && !thread.needsFollowUp) {
      return false;
    }

    if (filters.categories.length > 0) {
      const normalizedCategory = String(thread.categoryTag || '').toLowerCase();
      const matchedCategory = filters.categories.some((category) => normalizedCategory.includes(category.toLowerCase()));
      if (!matchedCategory) return false;
    }

    if (filters.senderIncludes.length > 0) {
      const haystack = `${thread.sender || ''} ${parseEmailAddress(thread.sender || '')}`.toLowerCase();
      const matchedSender = filters.senderIncludes.some((term) => haystack.includes(term));
      if (!matchedSender) return false;
    }

    if (filters.subjectIncludes.length > 0) {
      const haystack = `${thread.subject || ''} ${thread.snippet || ''}`.toLowerCase();
      const matchedSubject = filters.subjectIncludes.some((term) => haystack.includes(term));
      if (!matchedSubject) return false;
    }

    if (filters.dateWindowDays) {
      const timestamp = new Date(thread.lastUpdated || thread.createdAt || 0).getTime();
      const diffDays = (now - timestamp) / (1000 * 60 * 60 * 24);
      if (diffDays > filters.dateWindowDays) return false;
    }

    return true;
  });

  const ordered = results
    .slice()
    .sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt);
    })
    .slice(0, 20);

  return {
    prompt,
    filters,
    count: ordered.length,
    results: ordered
  };
};

module.exports = {
  DEMO_QUERIES,
  executeSearch
};
