const FOLLOW_UP_WINDOW_DAYS = 3;

const parseEmailAddress = (value = '') => {
  const match = String(value).match(/<([^>]+)>/);
  const email = (match ? match[1] : value).trim().toLowerCase();
  return email || '';
};

const stripDisplayName = (value = '') => {
  const raw = String(value).trim();
  if (!raw) return 'Unknown Sender';
  const withoutEmail = raw.replace(/\s*<[^>]+>\s*/, '').replace(/^"|"$/g, '').trim();
  return withoutEmail || raw;
};

const differenceInDays = (from, to = new Date()) => {
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return null;
  const diff = to.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const buildThreadState = ({
  messages = [],
  existingThread = {},
  userEmail = '',
  followUpWindowDays = FOLLOW_UP_WINDOW_DAYS
}) => {
  const normalizedUserEmail = String(userEmail || '').toLowerCase();
  
  // Safety: If null is passed explicitly, default parameters are ignored
  const thread = existingThread || {};
  
  let lastInboundAt = thread.lastInboundAt || null;
  let lastOutboundAt = thread.lastOutboundAt || null;
  let lastMessageAt = thread.lastMessageAt || thread.lastUpdated || thread.createdAt || null;
  let lastDirection = thread.lastDirection || 'unknown';
  let sourceEmail = thread.sourceEmail || parseEmailAddress(thread.sender);

  if (messages.length > 0) {
    let latestTimestamp = 0;

    messages.forEach((message) => {
      const headers = message.payload?.headers || [];
      const fromHeader = headers.find((header) => header.name.toLowerCase() === 'from')?.value || '';
      const internalDate = Number(message.internalDate || 0);
      const timestamp = internalDate || new Date(message.internalDate || message.payload?.headers?.date || 0).getTime();
      const normalizedSender = parseEmailAddress(fromHeader);
      const isOutbound = normalizedUserEmail && normalizedSender === normalizedUserEmail;
      const isoDate = timestamp ? new Date(timestamp).toISOString() : null;

      if (!sourceEmail && normalizedSender && !isOutbound) {
        sourceEmail = normalizedSender;
      }

      if (!isoDate) return;

      if (timestamp >= latestTimestamp) {
        latestTimestamp = timestamp;
        lastMessageAt = isoDate;
        lastDirection = isOutbound ? 'outbound' : 'inbound';
      }

      if (isOutbound) {
        if (!lastOutboundAt || new Date(isoDate) > new Date(lastOutboundAt)) {
          lastOutboundAt = isoDate;
        }
      } else if (!lastInboundAt || new Date(isoDate) > new Date(lastInboundAt)) {
        lastInboundAt = isoDate;
      }
    });
  }

  const daysSinceInbound = differenceInDays(lastInboundAt);
  const needsFollowUp =
    lastDirection === 'inbound' &&
    daysSinceInbound !== null &&
    daysSinceInbound >= followUpWindowDays &&
    existingThread.status !== 'done' &&
    !existingThread.archived &&
    !existingThread.trashed;

  return {
    sourceEmail,
    lastInboundAt,
    lastOutboundAt,
    lastMessageAt,
    lastDirection,
    followUpWindowDays,
    followUpAgeDays: daysSinceInbound,
    needsFollowUp,
    followUpReason: needsFollowUp
      ? `No reply sent for ${daysSinceInbound} day${daysSinceInbound === 1 ? '' : 's'}`
      : null
  };
};

module.exports = {
  FOLLOW_UP_WINDOW_DAYS,
  parseEmailAddress,
  stripDisplayName,
  differenceInDays,
  buildThreadState
};
