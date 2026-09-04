# Nebula Mail — AI-Controlled Mail Web Application

> **Production-grade mail application where an AI assistant controls the application UI in real time via a unified Command Layer.**

---

## 🌟 Architectural Overview

Nebula Mail is built on a fundamental non-negotiable principle: **Neither human clicks nor AI assistant commands ever invoke the Gmail API or mutate UI state directly.** Both flow through the exact same **Application Command Layer**, ensuring 100% testability, state synchronization, and auditability:

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   Human UI Clicks       │         │  AI Assistant Tool Call │
└───────────┬─────────────┘         └────────────┬────────────┘
            │                                    │
            └─────────────────┬──────────────────┘
                              ▼
            ┌────────────────────────────────────┐
            │    Application Command Layer       │
            │  (searchEmails, openEmail, etc.)   │
            └─────────────────┬──────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
    ┌──────────────────────┐    ┌──────────────────────────┐
    │  Zustand UI State    │    │   Service Layer          │
    │  & Smart Filter Chips│    │   (Gmail API / DB Cache) │
    └──────────────────────┘    └──────────────────────────┘
```

---

## 🚀 Key Features & Signature Controls

### 1. AI Action Timeline (Signature Feature #1)
The AI Assistant Panel renders an animated, real-time step list for every user instruction:
- `✓ Understanding request`
- `✓ Searching Gmail: from:"Sarah" keyword:"project update"`
- `✓ Found 3 matching emails`
- `✓ Opening email detail view`

### 2. Smart Filter Chips (Signature Feature #2)
A unified filter bar sits directly above the inbox list. Filter chips like `[Unread ✕]`, `[From: Sarah ✕]`, `[After: 2026-08-25 ✕]` are shared bi-directionally between human dropdown clicks and natural language AI commands.

### 3. Human-in-the-Loop Confirmation Cards
Actions that send or reply to emails (`send_email`, `reply_to_email`) require explicit human click confirmation on an interactive card before the email is dispatched.

---

## 🎯 5 Required Evaluation Scenarios

Nebula Mail handles all 5 core evaluation scenarios deterministically:

1. **Compose from Instruction**
   - *Instruction:* `"Send an email to john@example.com with subject Meeting Tomorrow and body Let's meet at 3pm."`
   - *Behavior:* Opens compose drawer, populates fields visibly, renders confirmation card, dispatches upon click.
2. **Time-Based Search**
   - *Instruction:* `"Show me emails from the last 10 days."`
   - *Behavior:* Converts to date range filter, updates inbox list, and mounts `[After: YYYY-MM-DD ✕]` filter chip.
3. **Person / Topic Search**
   - *Instruction:* `"Find the latest email from Sarah about the project update."`
   - *Behavior:* Executes structured search, finds matching email, and automatically opens full detail view.
4. **Context-Aware Reply**
   - *Instruction (with email open):* `"Reply that I'll handle it tomorrow."`
   - *Behavior:* Reads active email context, pre-fills reply draft with recipient & thread, and prompts confirmation.
5. **Natural-Language Compound Filters**
   - *Instruction:* `"Show only unread emails from this week."`
   - *Behavior:* Applies compound `isUnread: true` and `startDate` filter, updates list, and renders active filter chips.

---

## 🛠️ Technology Stack & Decisions Rationale

- **Framework:** **Next.js (App Router) + React + TypeScript + Tailwind CSS**
  - *Why:* Server-rendered routes, typed route handlers, and unified stack.
- **State Management:** **Zustand (UI/Client State) + TanStack Query (Server State)**
  - *Why:* Zustand provides lightweight client-side state for active filters, compose drawer, and timeline.
- **Database & Cache:** **PostgreSQL + Prisma ORM**
  - *Why:* Strictly typed ORM with relational schema (`User`, `OAuthAccount`, `EmailCache`, `Thread`, `SyncState`).
- **AI Agent Engine:** **Gemini 2.5 Flash + Zod Tool Schemas**
  - *Why:* Native function calling with validated Zod schemas for all 8 tool signatures.
- **Realtime Infrastructure:** **Gmail Watch + Google Cloud Pub/Sub + Server-Sent Events (SSE)**
  - *Why:* Instant push notifications without polling overhead.
- **Security:** **AES-256-GCM Token Encryption**
  - *Why:* OAuth refresh tokens are encrypted at rest server-side and never exposed to the client.

---

## 💻 Setup & Installation Guide

### Prerequisites
- **Node.js:** v20.x or higher
- **PostgreSQL:** Local or hosted instance (e.g. Neon, Supabase, Docker)
- **Google Cloud Console:** Project with Gmail API enabled & OAuth Client ID credentials

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/AbdulFahad31/nebula-mail.git
cd nebula-mail
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nebulamail?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

GEMINI_API_KEY="your-gemini-api-key"
AUTH_SECRET="your-32-byte-secret"
ENCRYPTION_SECRET="0123456789abcdef0123456789abcdef"

GCP_PUBSUB_TOPIC="projects/your-gcp-project/topics/gmail-watch-topic"
```

### 3. Initialize Database Schema
```bash
npx prisma db push
npx prisma generate
```

### 4. Run Application
```bash
npm run dev
```
Open [http://localhost:3000/inbox](http://localhost:3000/inbox) in your browser.

---

## 🧪 Testing

### Unit Tests (Vitest)
Validates Zod tool argument schemas, command layer functions, and Zustand store handlers:
```bash
npm test
```

### End-to-End Tests (Playwright)
Validates the 5 required evaluation scenarios end-to-end:
```bash
npx playwright test
```

---

## 🚀 What I'd Build Next With More Time

1. **AI Mail Categorization & VIP Priority Inbox:** Auto-tag incoming mail into Priority, Newsletters, and Actionable items.
2. **Multi-Account Unified Inbox:** Support switching between multiple Google accounts in a single drawer.
3. **Voice Command Integration:** Add Web Speech API to dictate instructions to the assistant hands-free.
