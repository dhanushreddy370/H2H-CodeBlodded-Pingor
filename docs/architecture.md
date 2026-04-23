# Pingor Architecture

## High-Level Flow

1. Gmail OAuth authenticates a user and stores tokens locally.
2. A heartbeat sync or manual sync pulls Gmail threads in batches.
3. Each thread is analyzed locally with Ollama for:
   - classification
   - priority
   - summary
   - action extraction
4. Threads and extracted action items are stored in the local JSON database.
5. The frontend surfaces:
   - Inbox
   - Tasks
   - Follow-ups
   - Daily Digest
   - Smart Search
   - Agentic Chat

## Data Model

### Thread

- `_id`
- `threadId`
- `subject`
- `snippet`
- `content`
- `aiSummary`
- `categoryTag`
- `priority`
- `sender`
- `sourceEmail`
- `userId`
- `status`
- `lastInboundAt`
- `lastOutboundAt`
- `lastMessageAt`
- `lastDirection`
- `needsFollowUp`
- `followUpAgeDays`
- `followUpReason`

### Action Item

- `_id`
- `threadId`
- `userId`
- `action`
- `owner`
- `deadline`
- `priority`
- `sender`
- `sourceEmail`
- `status`

## Follow-Up Detection

Pingor marks a thread as needing follow-up when:

- the latest message is inbound
- the user has not replied
- the inbound message is at least 3 days old
- the thread is still open

## Smart Search

Smart Search runs over the locally stored thread database.

- The UI sends a natural-language prompt.
- The backend infers filters such as sender, urgency, category, response state, and time window.
- Matching threads are returned sorted by priority and recency.

## Daily Digest

The Daily Digest is generated from the local database and includes:

- overview metrics
- urgent actions
- overdue follow-ups
- recent highlights

The digest is returned as structured JSON plus a markdown rendering for hackathon deliverables.
