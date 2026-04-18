# Pingor: Agentic Email & Communication Tracker

## 🏆 Hackathon Progress Log

- **Day 1:** Set up the basic structural foundations. Created the React frontend and Node/Express backend. Configured Google OAuth2 for Gmail API access.
- **Day 2:** Created MongoDB data models (Thread, SyncLog, ActionItem). Implemented `node-cron` for an automated hourly heartbeat sync that fetches the latest threads and upserts them into the database.
- **Day 3:** Integrated the local LLM (Ollama) into the sync pipeline. Created `aiService.js` to categorize threads automatically. Built an interactive CLI app (`terminalChat.js`) that handles OAuth authentication and fetches live emails. Transformed this basic LLM chat into an autonomous LangChain Agent using `createToolCallingAgent`. Built dynamic tools (`gmailTools.js`) giving Pingor the ability to autonomously search emails, read specific threads, and create email drafts directly in the user's Gmail. Additionally, implemented persistent OAuth token caching to streamline development!

---

## 1. Project Title & Tagline

**Pingor** - Your Privacy-First Intelligent Email Sidekick.

## 2. Problem Statement

In the modern workplace, email overload is a productivity killer. Users spend hours sorting through low-priority messages and identifying critical action items. Most AI solutions for this problem compromise privacy by processing sensitive communications on public clouds.

## 3. Proposed Solution

Pingor is a local-first Agentic Assistant that automates email management without sacrificing privacy. By utilizing **Ollama (Llama 3.2/Mistral)** locally, Pingor categorizes threads, extracts action items, and handles low-priority replies entirely on your own machine.

## 4. Tech Stack

- **Frontend:** React.js, Lucide Icons, Vanilla CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI Engine:** Ollama (Local LLM - Llama 3.2 / Mistral)
- **APIs:** Gmail API (OAuth2)
- **Scheduling:** Node-Cron for hourly heartbeat sync

## 5. Features

- **Hourly Heartbeat Sync:** Automatically polls Gmail every hour to fetch new threads.
- **Local AI Tagging:** Uses local LLMs to categorize emails (Urgent, Work, Promotion, Spam) and extract tasks.
- **AI Chat Interface:** Natural language interface to query your communications (e.g., "What are my deadlines for this week?").
- **Auto-Reply System:** Automated 'Thank You' responses for low-priority/acknowledgment-only emails.
- **Privacy-First:** All AI processing happens locally; no email content leaves your system for training or inference.

## 6. Architecture & Flow

`Gmail API` -> `Node-Cron (Heartbeat)` -> `Local AI (Ollama)` -> `MongoDB` -> `React Frontend`

1. **Poll:** Node server triggers a Gmail API fetch.
2. **Analyze:** Content is sent to the local Ollama instance for tagging and extraction.
3. **Store:** Metadata and extracted action items are saved to MongoDB.
4. **Display:** React UI provides a dashboard for tracking and an AI chat for querying.

## 7. Setup Instructions

### Prerequisites

- Install [Ollama](https://ollama.ai/)
- Install Node.js & MongoDB

### Ollama Setup

```bash
ollama run llama3.2
```

### Application Setup

1. **Clone the Repo:**

   ```bash
   git clone <repo-url>
   cd H2H-CodeBlodded-Pingor
   ```

2. **Server Setup:**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Fill in your Gmail OAuth2 Credentials
   npm run dev
   ```

3. **Client Setup:**

   ```bash
   cd ../client
   npm install
   npm start
   ```

## 8. Demo / Screenshots

*(Placeholders for screenshots)*
Coming soon

## 9. Team Members

- **CodeBlooded Team**
- Dhanush Reddy S [Team Lead]
- M Rithika
