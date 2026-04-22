# Pingor: Agentic Email & Communication Tracker

## 🏆 Hackathon Progress Log

- **Day 1:** Set up the basic structural foundations. Created the React frontend and Node/Express backend. Configured Google OAuth2 for Gmail API access.
- **Day 2:** Created MongoDB data models (Thread, SyncLog, ActionItem). Implemented `node-cron` for an automated hourly heartbeat sync that fetches the latest threads and upserts them into the database.
- **Day 3:** Integrated the local LLM (Ollama) into the sync pipeline. Created `aiService.js` to categorize threads automatically. Built an interactive CLI app (`terminalChat.js`) that handles OAuth authentication and fetches live emails. Transformed this basic LLM chat into an autonomous LangChain Agent using `createToolCallingAgent`. Built dynamic tools (`gmailTools.js`) giving Pingor the ability to autonomously search emails, read specific threads, and create email draft suggestions directly in the user's Gmail. Additionally, implemented persistent OAuth token caching to streamline development!
- **Day 4:** Accelerated frontend development. Built the central Dashboard, Tasks, and Follow-up pages with advanced filtering/sorting. Implemented a "Context Injection" system using `/` and `@` triggers in the chat window. Developed the "Draft Approval" logic where the AI proposes a complex email body based on user prompts, which the user reviews and edits before sending.
- **Day 5:** Achieved production-grade scalability by migrating the entire persistence layer to **MongoDB Atlas**, enabling persistent user profiles, global settings, and multi-user association. Refactored the core synchronization engine for cloud-backed reliability and implemented the initial framework for premium Detail Modals and real-time Gmail sync actions (Archive/Trash).
- **Day 6:** Finalized the UI/UX overhaul and stabilized the platform. Resolved critical runtime performance bottlenecks and hook violations in the floating chat. Refined the **Detail Modal** with perfect centering and responsive layouts. Completed the **Inbox** feature set with a functional **Quick Compose** system and advanced thread filtering.
- **Day 7:** Optimized platform autonomy and communication efficiency. Implemented full email body extraction and rich-text rendering in the Inbox. Added 'Reply' and 'AI Generate Reply' actions, enabling one-click professional drafts using local AI. Refined the global UI with perfect modal centering (compensating for sidebar offsets) and a compact, scroll-free workspace layout. Stabilized the authentication flow and background sync heartbeat to ensure 100% data freshness without manual intervention.

---

## 1. Project Title & Tagline

**Pingor** - Your Production-Grade Intelligent Communication Sidekick.

## 2. Problem Statement

In the modern workplace, email overload is a productivity killer. Users spend hours sorting through low-priority messages and identifying critical action items. Scalable, persistent tracking and collaborative task management are essential for modern teams.

## 3. Proposed Solution

Pingor is a production-ready Agentic Assistant that automates email management and task tracking. By integrating a high-performance **Local JSON DB** for offline-capable persistence and **Ollama (Llama 3.2)** locally, Pingor categorizes threads, extracts action items, and handles communication entirely with a high-fidelity user experience.

## 4. Tech Stack

- **Frontend:** React.js, Lucide Icons, Vanilla CSS
- **Backend:** Node.js, Express.js
- **Database:** Local JSON Persistence (High-performance, offline-capable, privacy-focused)
- **AI Engine:** Ollama (Local LLM - Llama 3.2)
- **Agent Framework:** LangChain (ReAct Tool Calling Architecture)
- **APIs:** Gmail API (OAuth2)
- **Scheduling:** Node-Cron for synchronized 10-minute heartbeat tracking

## 5. Features

- **Local Persistence:** Full CRUD operations for tasks, threads, and chat history with zero external database dependencies.
- **AI-Powered Communication:** One-click 'AI Generate Reply' that drafts professional responses based on thread context.
- **Full Email Sync:** Real-time extraction of full email bodies with HTML rendering for a complete inbox experience.
- **Gmail Synchronization:** Native Archive and Trash actions from the Pingor UI that reflect instantly in your Gmail inbox.
- **Premium Detail Modal:** A centered, scroll-free interface for deep-task editing, including multi-user assignment and comment threads.
- **Intelligent Chat:** Resizable AI chat window with "Context Injection" and functional file attachments.

## 6. Architecture & Flow

`Gmail API` -> `Node-Cron (Heartbeat)` -> `Local AI (Ollama)` -> `MongoDB Atlas` -> `React Frontend`

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
