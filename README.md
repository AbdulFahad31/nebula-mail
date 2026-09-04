# Nebula Mail — Premium Dark Theme Mail Client with Native AI Controls

Nebula Mail is a state-of-the-art desktop-first email application built with **Next.js**, a **Unified Command Layer**, **Google Gmail API Integration**, **Server-Sent Events (SSE) Push Synchronization**, **Gemini AI Function Calling**, and a **curated dark palette featuring a muted sage green accent (`#6B9971`)**.

---

## 🎨 Design System & Visual Palette

Nebula Mail features a dark interface engineered with strict palette constraints, typographic hierarchy, and embedded email isolation.

### 1. Locked Color System

| UI Layer / Role | Hex Code | Usage & Application |
| :--- | :--- | :--- |
| **Background Base** | `#14161A` | Root app shell, sidebar navigation, inbox list canvas, reading pane background. |
| **Background Elevated** | `#1C1F24` | Top navbar, search inputs, AI assistant panel, selected email row, compose modal, confirmation cards. |
| **Border & Hairline Dividers** | `#2A2D33` | 1px subtle structural borders separating columns, cards, and input fields. |
| **Primary Accent Hue** | `#6B9971` | **Muted Sage Green**: Applied uniformly across "New Message" button, active tab underlines (`Inbox`/`Sent`), unread email dots, active selection left border rule, status indicators, and AI timeline icons. |
| **Text Primary** | `#EDECE8` | Headings, sender names, email subject titles, active text (soft off-white). |
| **Text Secondary / Muted** | `#9A9CA3` | Body preview text, input placeholders. |
| **Text Tertiary** | `#6B6D73` | Timestamps, metadata labels ("To", "Subject"), uppercase section headers. |

### 2. Typography Rules
- **Display & Headings**: `Fraunces` (serif-display) for the *Nebula Mail* branding, reading pane email subjects, sender names, and modal titles.
- **Interface & Controls**: `Geist` (sans) for buttons, inputs, timestamps, email body preview text, and AI assistant timeline entries.

### 3. Embedded Third-Party Email Card Architecture
To prevent third-party HTML email styles (e.g. from Google, Oracle, LinkedIn, EY) from bleeding into or corrupting the application dark theme:
- HTML content is safely isolated within a dedicated desaturated `#FAFAF8` light preview card.
- Wrapped in a dark `#1C1F24` container with a 1px `#2A2D33` border and an explicit design intent label:
  ```text
  • ORIGINAL FORMATTING PRESERVED
  ```
- Ensures third-party emails render cleanly as external documents without disrupting the dark UI shell.

---

## 🏛️ Application Architecture & Core Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (React / Next.js)                        │
│                                                                                        │
│  ┌───────────────────────┐   ┌─────────────────────────┐   ┌────────────────────────┐  │
│  │   Inbox / Email View   │   │  Compose & Reply Modal  │   │  AI Assistant Panel    │  │
│  └───────────┬───────────┘   └────────────┬────────────┘   └───────────┬────────────┘  │
│              │                            │                            │               │
│              └────────────────────────────┼────────────────────────────┘               │
│                                           ▼                                            │
│                               UNIFIED COMMAND LAYER (`src/lib/commands`)                │
│                                           │                                            │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     ┌────────────────────────────┐                  ┌─────────────────────────────┐
     │   Zustand Client Store     │                  │    Server Endpoints (API)   │
     │   (`useMailStore.ts`)      │                  │                             │
     └────────────────────────────┘                  ├─────────────────────────────┤
                                                     │ • /api/gmail/sync           │
                                                     │ • /api/gmail/send           │
                                                     │ • /api/gmail/account        │
                                                     │ • /api/sync/sse             │
                                                     │ • /api/assistant/chat       │
                                                     └──────────────┬──────────────┘
                                                                    │
                                            ┌───────────────────────┴───────────────────────┐
                                            ▼                                               ▼
                             ┌────────────────────────────┐                  ┌─────────────────────────────┐
                             │  Prisma ORM + SQLite DB    │                  │  External Services          │
                             │  (`dev.db`)                │                  │  • Google Gmail API         │
                             └────────────────────────────┘                  │  • Gemini AI Function Calls │
                                                                             └─────────────────────────────┘
```

---

## 🌟 Key Features & Capabilities

### 1. Unified Command Layer (`src/lib/commands/index.ts`)
A symmetric command architecture where user actions (clicks, key presses) and AI function tool calls trigger identical underlying functions:
- `commandSearchEmails`: Filters inbox email list by keyword or sender.
- `commandOpenEmail`: Selects an email thread and opens detail pane.
- `commandApplyFilter`: Toggles smart filter chips (Unread, Important).
- `commandOpenCompose`: Opens the draft compose drawer.
- `commandPopulateCompose`: Pre-fills compose fields (recipient, subject, body).
- `commandSendEmail`: Initiates sending an email.
- `commandReplyEmail`: Sets up a threaded reply.
- `commandForwardEmail`: Prepares a forward email draft.
- `executeSendEmailDirect`: Dispatches direct email requests to Gmail API.

### 2. Gmail API Integration & Encryption
- **Google OAuth 2.0 Auth Flow**: Authenticates users and generates access/refresh tokens.
- **AES-256-GCM Token Encryption**: Stores encrypted refresh tokens securely in database (`src/lib/auth/crypto.ts`).
- **Live Sync Engine**: Fetches messages and threads directly from Google Gmail API (`src/lib/gmail/messages.ts`).
- **Mock Data Fallback**: Automatically seeds high-quality local mock threads when no Google account is connected.

### 3. Real-Time Push Pipeline (Server-Sent Events)
- **SSE Stream (`/api/sync/sse`)**: Keeps the browser inbox UI in live sync with background mail sync operations without requiring page refreshes.

### 4. AI Assistant & Security Guard (`src/app/api/assistant/chat`)
- **Gemini API Integration**: Uses `@google/genai` with Zod parameter schemas for function calling (`src/lib/ai/schemas.ts`).
- **Human-in-the-Loop Confirmation Guard**: Destructive or outbound actions (sending email, replying) require explicit user approval via an **Authorization Required** card before execution.
- **Real-Time Action Timeline**: Visual timeline (`ActionTimeline.tsx`) displays live tool call statuses (`running`, `completed`, `failed`).

---

## 📋 Interactive Feature Guide

| # | Feature | Trigger / Command | Expected Visual Outcome |
|---|---|---|---|
| **1** | **Email Selection** | Click any email row in inbox list. | Selected row highlights with left border (`#6B9971`), detail pane displays email body, headers, and sender avatar. |
| **2** | **Tab Navigation** | Click **Inbox** or **Sent** tabs. | Active tab updates with green underline (`#6B9971`), email list updates accordingly. |
| **3** | **Search & Smart Filters** | Type in top search bar or click smart chips. | Active filter chip appears, list filters immediately, **Clear** resets view. |
| **4** | **Manual Compose & Send** | Click **New Message**, fill form, click **Send**. | Bottom-right modal opens, submits via Gmail API (or mock cache), updates list and switches to Sent tab. |
| **5** | **AI Search & Open** | Type: *"Find emails about Q3 report"* in AI panel. | AI executes `searchEmails` and `openEmail`. Email list filters and matching message opens in reading pane. |
| **6** | **AI Smart Filter** | Type: *"Show me all unread emails"*. | AI executes `applyFilter`. `Unread Only` chip activates, list filters to unread messages. |
| **7** | **AI Draft Preparation** | Type: *"Draft a reply to Sarah saying I will review this"*. | AI executes `populateCompose`. Compose modal opens pre-filled with recipient, subject (`Re: ...`), and body. |
| **8** | **AI Authorization Guard** | Type: *"Send email to alex@example.com subject 'Update' body 'All clear'"*. | Outbound email is held in an **Authorization Required** card. Clicking **Authorize & send** completes the dispatch. |

---

## 🛠️ Environment Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Environment Variables (`.env`)

Create a `.env` file in the project root with the following keys:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini API Key for AI Assistant
GEMINI_API_KEY="your-gemini-api-key"

# AES-256-GCM Token Encryption Key (Must be 64-char hex string)
TOKEN_ENCRYPTION_SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# NextAuth Secret
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# SQLite Database Connection
DATABASE_URL="file:./dev.db"
```

### 3. Local Setup Commands

```bash
# Install project dependencies
npm install

# Apply database migrations / push schema
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000/inbox](http://localhost:3000/inbox) in your browser.

---

## 🧪 Testing & Code Quality

```bash
# Run Vitest unit test suite
npm test

# Run TypeScript type check
npx tsc --noEmit

# Run production build validation
npm run build
```

- **Unit Test Suite**: 7/7 passed (`tests/unit/commands.test.ts`, `tests/unit/ai-tools.test.ts`).
- **TypeScript Type Checker**: 0 errors.
- **Production Build**: Clean compilation.

---

## 📄 Repository Information

- **Repository**: [https://github.com/AbdulFahad31/nebula-mail.git](https://github.com/AbdulFahad31/nebula-mail.git)
- **Branch**: `main`
