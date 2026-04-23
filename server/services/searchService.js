const { readDB } = require('./dbService');
const { parseEmailAddress, stripDisplayName } = require('./threadUtils');
const { generateFilterQuery } = require('./aiService');

const DEMO_QUERIES = [
  'show me the emails that I have received today',
  'emails from Ravi today',
  'show me approval emails from Ravi',
  'show me customer onboarding emails',
  'show me vendor emails about invoices',
  'show me meeting-related emails',
  'show me urgent emails from support team',
  'emails I sent today'
];

const senderDirectory = [
  'ravi', 'priya', 'alex', 'finance', 'hr', 'vendor', 'customer', 'recruiter', 'manager', 'ops'
];

const STOP_WORDS = new Set([
  'find', 'show', 'me', 'all', 'emails', 'email', 'threads', 'thread', 'messages', 'message',
  'from', 'about', 'regarding', 'with', 'where', 'that', 'which', 'mention', 'mentions',
  'still', 'open', 'need', 'needs', 'my', 'reply', 'responded', 'response', 'have', 'has',
  'the', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'at', 'is', 'are', 'be',
  'last', 'past', 'today', 'week', 'month', 'urgent', 'high', 'priority', 'pending',
  'i', 'received', 'receive', 'recieved', 'recieve', 'got', 'getting', 'inbox', 'incoming',
  'sent', 'mail', 'mails', 'latest', 'recent'
]);

const CATEGORY_SYNONYMS = [
  ['action-required', ['action required', 'action-required', 'task', 'todo', 'follow up', 'follow-up']],
  ['FYI/informational', ['fyi', 'informational', 'newsletter', 'newsletters', 'update', 'updates']],
  ['meeting-related', ['meeting', 'meetings', 'calendar', 'schedule', 'scheduling', 'sync', 'review']],
  ['approval-pending', ['approval', 'approve', 'approved', 'pending approval', 'sign off', 'signoff']],
  ['vendor/external', ['vendor', 'external', 'supplier', 'invoice', 'payment', 'contract']],
  ['personal', ['personal', 'recruiter', 'recruiters', 'candidate', 'candidates', 'interview']]
];

const SUBJECT_HINTS = ['budget', 'invoice', 'payment', 'onboarding', 'approval', 'candidate', 'finance', 'contract', 'review'];

const uniqueLowerCase = (values = []) => [...new Set(values.filter(Boolean).map((value) => String(value).trim().toLowerCase()))];

const extractPhraseAfter = (normalizedPrompt, marker) => {
  const match = normalizedPrompt.match(new RegExp(`${marker}\\s+([^,.?!]+)`, 'i'));
  if (!match) return '';
  return match[1]
    .replace(/\b(where|that|who|which|and|or|with|from|about|regarding|need|needs|still|open|urgent|priority|last|past|today)\b.*$/i, '')
    .trim();
};

const tokenizePrompt = (prompt = '') => (
  prompt
    .toLowerCase()
    .replace(/[^a-z0-9@\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token))
);

const shouldUseAiHints = (filters) => {
  const strongSignals =
    filters.categories.length > 0 ||
    filters.senderIncludes.length > 0 ||
    filters.subjectIncludes.length > 0 ||
    filters.minPriority !== null ||
    filters.needsFollowUp ||
    Boolean(filters.direction) ||
    Boolean(filters.datePreset) ||
    Boolean(filters.dateWindowDays);

  return !strongSignals;
};

const INBOUND_PATTERNS = [
  /\bemails?\s+i\s+(?:have\s+)?(?:received|receive|recieved|recieve|got)\b/i,
  /\bmessages?\s+i\s+(?:have\s+)?(?:received|receive|recieved|recieve|got)\b/i,
  /\b(?:received|receive|recieved|recieve|got)\s+(?:today|yesterday|this week|last week|last month)?\b/i,
  /\binbox\b/i,
  /\bincoming\b/i,
  /\bsent to me\b/i
];

const OUTBOUND_PATTERNS = [
  /\bemails?\s+i\s+sent\b/i,
  /\bmessages?\s+i\s+sent\b/i,
  /\bmy sent\b/i,
  /\bsent emails?\b/i,
  /\boutbound\b/i
];

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isSameLocalDay = (left, right) => (
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()
);

const resolveEventTimestamp = (thread, filters) => {
  if (filters.direction === 'inbound') {
    return thread.lastInboundAt || null;
  }

  if (filters.direction === 'outbound') {
    return thread.lastOutboundAt || null;
  }

  return thread.lastMessageAt || thread.lastUpdated || thread.createdAt || thread.lastInboundAt || thread.lastOutboundAt || null;
};

const matchesDateFilter = (thread, filters, now = new Date()) => {
  const rawTimestamp = resolveEventTimestamp(thread, filters);
  if (!rawTimestamp) {
    return false;
  }

  const timestamp = new Date(rawTimestamp);
  if (Number.isNaN(timestamp.getTime())) {
    return false;
  }

  if (filters.datePreset === 'today') {
    return isSameLocalDay(timestamp, now);
  }

  if (filters.datePreset === 'yesterday') {
    const yesterday = startOfDay(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameLocalDay(timestamp, yesterday);
  }

  if (filters.dateWindowDays) {
    const diffDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= filters.dateWindowDays;
  }

  return true;
};

const inferPromptFilters = (prompt = '', candidateSenders = []) => {
  const normalized = prompt.toLowerCase();
  const filters = {
    categories: [],
    minPriority: null,
    senderIncludes: [],
    subjectIncludes: [],
    textIncludes: [],
    needsFollowUp: false,
    includeDone: false,
    direction: null,
    datePreset: null,
    dateWindowDays: null
  };

  if (INBOUND_PATTERNS.some((pattern) => pattern.test(prompt))) {
    filters.direction = 'inbound';
  } else if (OUTBOUND_PATTERNS.some((pattern) => pattern.test(prompt))) {
    filters.direction = 'outbound';
  }

  if (
    normalized.includes('not responded') ||
    normalized.includes('have not responded') ||
    normalized.includes('waiting on me') ||
    normalized.includes('need my reply') ||
    normalized.includes('needs my reply') ||
    normalized.includes('awaiting my response') ||
    normalized.includes('still open')
  ) {
    filters.needsFollowUp = true;
  }

  if (
    normalized.includes('urgent') ||
    normalized.includes('critical') ||
    normalized.includes('high priority') ||
    normalized.includes('important')
  ) {
    filters.minPriority = 4;
  }

  if (normalized.includes('done') || normalized.includes('completed') || normalized.includes('closed')) {
    filters.includeDone = true;
  }

  if (normalized.includes('last week') || normalized.includes('past week')) {
    filters.dateWindowDays = 7;
  } else if (normalized.includes('today')) {
    filters.datePreset = 'today';
    filters.dateWindowDays = 1;
  } else if (normalized.includes('yesterday')) {
    filters.datePreset = 'yesterday';
    filters.dateWindowDays = 1;
  } else if (normalized.includes('last month')) {
    filters.dateWindowDays = 30;
  }

  CATEGORY_SYNONYMS.forEach(([category, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      filters.categories.push(category);
    }
  });

  [...senderDirectory, ...candidateSenders].forEach((sender) => {
    if (normalized.includes(sender)) {
      filters.senderIncludes.push(sender);
    }
  });

  const explicitFrom = extractPhraseAfter(normalized, 'from');
  if (explicitFrom) {
    filters.senderIncludes.push(explicitFrom);
  }

  ['about', 'regarding'].forEach((marker) => {
    const phrase = extractPhraseAfter(normalized, marker);
    if (phrase) {
      filters.subjectIncludes.push(...phrase.split(/\s+/).filter(Boolean));
    }
  });

  const quotedPhrases = normalized.match(/"([^"]+)"/g) || [];
  quotedPhrases.forEach((phrase) => {
    const cleaned = phrase.replace(/"/g, '').trim();
    if (cleaned) filters.subjectIncludes.push(cleaned);
  });

  SUBJECT_HINTS.forEach((term) => {
    if (normalized.includes(term)) {
      filters.subjectIncludes.push(term);
    }
  });

  filters.textIncludes.push(
    ...tokenizePrompt(prompt).filter((token) =>
      !filters.senderIncludes.some((sender) => sender.includes(token)) &&
      !filters.subjectIncludes.includes(token)
    )
  );

  filters.categories = uniqueLowerCase(filters.categories);
  filters.senderIncludes = uniqueLowerCase(filters.senderIncludes);
  filters.subjectIncludes = uniqueLowerCase(filters.subjectIncludes);
  filters.textIncludes = uniqueLowerCase(filters.textIncludes);

  return filters;
};

const applyAiHints = (filters, aiQuery = {}) => {
  const nextFilters = { ...filters };
  const normalizeList = (value) => (
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  );

  const senderTerms = normalizeList(aiQuery.sender || aiQuery.from || aiQuery.senderIncludes);
  const subjectTerms = normalizeList(aiQuery.subject || aiQuery.subjectIncludes || aiQuery.snippet);
  const categoryTerms = normalizeList(aiQuery.category || aiQuery.type || aiQuery.categories);

  nextFilters.senderIncludes = uniqueLowerCase([...nextFilters.senderIncludes, ...senderTerms]);
  nextFilters.subjectIncludes = uniqueLowerCase([...nextFilters.subjectIncludes, ...subjectTerms]);
  nextFilters.categories = uniqueLowerCase([...nextFilters.categories, ...categoryTerms]);

  const aiPriority = Number(aiQuery.priority || aiQuery.minPriority);
  if (!Number.isNaN(aiPriority) && aiPriority > 0) {
    nextFilters.minPriority = nextFilters.minPriority ? Math.max(nextFilters.minPriority, aiPriority) : aiPriority;
  }

  if (aiQuery.status && /open|pending|waiting/i.test(String(aiQuery.status))) {
    nextFilters.needsFollowUp = true;
  }

  if (typeof aiQuery.needsFollowUp === 'boolean') {
    nextFilters.needsFollowUp = aiQuery.needsFollowUp;
  }

  if (!nextFilters.direction && typeof aiQuery.direction === 'string') {
    const normalizedDirection = String(aiQuery.direction).toLowerCase();
    if (normalizedDirection === 'inbound' || normalizedDirection === 'outbound') {
      nextFilters.direction = normalizedDirection;
    }
  }

  if (!nextFilters.direction && typeof aiQuery.lastDirection === 'string') {
    const normalizedDirection = String(aiQuery.lastDirection).toLowerCase();
    if (normalizedDirection === 'inbound' || normalizedDirection === 'outbound') {
      nextFilters.direction = normalizedDirection;
    }
  }

  if (!nextFilters.datePreset && typeof aiQuery.datePreset === 'string') {
    const normalizedPreset = String(aiQuery.datePreset).toLowerCase();
    if (normalizedPreset === 'today' || normalizedPreset === 'yesterday') {
      nextFilters.datePreset = normalizedPreset;
    }
  }

  return nextFilters;
};

const computeMatchScore = (thread, filters) => {
  const haystack = [
    thread.subject,
    thread.snippet,
    thread.aiSummary,
    thread.sender,
    thread.content,
    thread.categoryTag
  ].join(' ').toLowerCase();

  let score = 0;

  if (filters.senderIncludes.length > 0) {
    const senderHaystack = `${thread.sender || ''} ${parseEmailAddress(thread.sender || '')} ${thread.sourceEmail || ''} ${stripDisplayName(thread.sender || '')}`.toLowerCase();
    const senderHits = filters.senderIncludes.filter((term) => senderHaystack.includes(term));
    if (senderHits.length === 0) return -1;
    score += senderHits.length * 6;
  }

  if (filters.subjectIncludes.length > 0) {
    const subjectHaystack = `${thread.subject || ''} ${thread.snippet || ''} ${thread.aiSummary || ''}`.toLowerCase();
    const subjectHits = filters.subjectIncludes.filter((term) => subjectHaystack.includes(term));
    if (subjectHits.length === 0) return -1;
    score += subjectHits.length * 5;
  }

  if (filters.textIncludes.length > 0) {
    const textHits = filters.textIncludes.filter((term) => haystack.includes(term));
    if (textHits.length === 0 && filters.senderIncludes.length === 0 && filters.subjectIncludes.length === 0 && filters.categories.length === 0) {
      return -1;
    }
    score += textHits.length * 2;
  }

  if (filters.categories.length > 0) {
    const normalizedCategory = String(thread.categoryTag || '').toLowerCase();
    const matchedCategories = filters.categories.filter((category) => normalizedCategory.includes(category));
    if (matchedCategories.length === 0) return -1;
    score += matchedCategories.length * 4;
  }

  if (filters.needsFollowUp && thread.needsFollowUp) {
    score += 4;
  }

  if (filters.direction === 'inbound' && thread.lastInboundAt) {
    score += 2;
  }

  if (filters.direction === 'outbound' && thread.lastOutboundAt) {
    score += 2;
  }

  if (filters.minPriority && (thread.priority || 0) >= filters.minPriority) {
    score += 3;
  }

  return score;
};

const executeSearch = async ({ userId, prompt }) => {
  const db = readDB();
  const threads = (db.threads || []).filter((thread) => thread.userId === userId);
  const candidateSenders = threads.flatMap((thread) => {
    const sender = stripDisplayName(thread.sender || '');
    const email = parseEmailAddress(thread.sender || '');
    return [sender, email].filter(Boolean);
  });
  const manualFilters = inferPromptFilters(prompt, candidateSenders);
  let filters = manualFilters;
  const now = new Date();

  if (shouldUseAiHints(manualFilters)) {
    try {
      const aiFilters = await generateFilterQuery(prompt);
      filters = applyAiHints(filters, aiFilters);
    } catch (error) {
      // Deterministic fallback is already in place.
    }
  }

  const results = threads.filter((thread) => {
    if (filters.minPriority && (thread.priority || 0) < filters.minPriority) {
      return false;
    }

    if (filters.needsFollowUp && !thread.needsFollowUp) {
      return false;
    }

    if (!filters.includeDone && thread.status === 'done') {
      return false;
    }

    if (filters.direction === 'inbound' && !thread.lastInboundAt) {
      return false;
    }

    if (filters.direction === 'outbound' && !thread.lastOutboundAt) {
      return false;
    }

    if ((filters.datePreset || filters.dateWindowDays) && !matchesDateFilter(thread, filters, now)) {
      return false;
    }

    return true;
  });

  const ordered = results
    .map((thread) => ({ thread, score: computeMatchScore(thread, filters) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if ((b.thread.priority || 0) !== (a.thread.priority || 0)) {
        return (b.thread.priority || 0) - (a.thread.priority || 0);
      }
      return new Date(b.thread.lastUpdated || b.thread.createdAt) - new Date(a.thread.lastUpdated || a.thread.createdAt);
    })
    .map(({ thread }) => thread)
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
