# Nebula Mail — Classic Correspondence Interface with Native AI Controls

Nebula Mail is a modern desktop-first mail application engineered with a **Unified Command Layer**, **Google Gmail API integration**, **Server-Sent Events (SSE) push synchronization**, **Gemini AI function calling**, and a **fountain-pen-ink correspondence visual identity**.

---

## 🌟 Comprehensive Feature Matrix

### 1. Unified Command Layer (`src/lib/commands/index.ts`)
- Symmetric command pattern where human UI interactions and AI function tool calls invoke identical underlying commands:
  - `commandSearchEmails`
  - `commandOpenEmail`
  - `commandApplyFilter`
  - `commandOpenCompose`
  - `commandPopulateCompose`
  - `commandSendEmail`
  - `commandReplyEmail`
  - `commandForwardEmail`
  - `executeSendEmailDirect`

### 2. Gmail API Integration & Local Cache Architecture
- **Google OAuth 2.0 Authentication**: Complete authorization flow with refresh token retrieval and AES-256-GCM encryption (`src/lib/auth/crypto.ts`).
- **Prisma ORM + SQLite Database Cache (`dev.db`)**: Fast zero-config local persistence for `User`, `OAuthAccount`, `Thread`, `EmailCache`, and `SyncState`.
- **Per-User Mock Data Upsert**: Robust seeding engine providing fallback correspondence for instant testing across all accounts.

### 3. Real-Time Push Pipeline (`src/app/api/sync/sse/route.ts`)
- Server-Sent Events (SSE) push channel streaming inbox updates to active clients for instant real-time UI synchronization without page refreshes.

### 4. AI Assistant & Function Calling Engine (`src/app/api/assistant/chat/route.ts`)
- **Gemini API Integration**: Uses `@google/genai` with strict Zod parameter schemas (`src/lib/ai/schemas.ts`).
- **Client-Side Tool Execution Router (`executeClientAIToolCall`)**: Dispatches AI tool actions directly within the browser React environment, updating Zustand store state live.
- **Confirmation-Before-Send Security Guard**: Holds destructive and outbound actions (email send, reply) in a human-in-the-loop authorization card before dispatching.
- **Action Timeline Feed (`src/components/assistant/ActionTimeline.tsx`)**: Step-by-step progress visualizer tracking running, completed, and failed tool calls.

### 5. Bespoke Fountain-Pen-Ink Correspondence Aesthetic
- **Strict Two-Font Rule**:
  - **Source Serif 4 (Semibold 600)**: Used for *Nebula Mail* wordmark, reading headers, sender names, and list subject lines.
  - **IBM Plex Sans (400 / 500)**: Used for all UI controls, buttons, timestamps, body text, and assistant feeds.
- **Locked Palette**:
  - Paper Background (`#FAFAF8`)
  - Ink Charcoal (`#201F1B`) at 100%, 60% opacity, and 15% hairline borders
  - Deep Bottle Green (`#24463A`) reserved strictly for unread dots, active tab underlines, and primary action fills.

---

## 📋 Feature Guide & Verification

| # | Feature Name | Description & Trigger | Expected Visual Outcome |
|---|---|---|---|
| **1** | **Manual Inbox Navigation** | Click **Inbox** or **Sent** tabs, or click any email row. | Active tab gets `#24463A` underline, selected row gets left border rule, middle pane loads subject, sender card, timestamp, and body. |
| **2** | **Search & Filter** | Type in top search bar (e.g. `Sarah` or `Q3`). | Active filter chip appears (`Keyword: Sarah`), email list filters instantly, **Clear** button resets view. |
| **3** | **Compose & Direct Send** | Click **New Message** button, fill fields, click **Send**. | Drawer modal opens in bottom right, submit closes modal, clears search filters, switches to **Sent** tab, and updates list. |
| **4** | **AI Search Command** | Type: `Find emails from Sarah about Q3 report`. | Timeline logs `searchEmails` and `openEmail`. List filters and Sarah's Q3 email opens in full in middle pane. |
| **5** | **AI Smart Unread Filter** | Type: `Show me all unread emails`. | Timeline logs `applyFilter`. An `Unread Only` chip appears, filtering list to unread dots. |
| **6** | **AI Auto-Populate Compose** | Type: `Draft a reply saying "I will review this tomorrow"`. | Timeline logs `populateCompose`. Compose drawer opens pre-filled with recipient, subject `Re: ...`, and draft body. |
| **7** | **AI Confirmation Guard** | Type: `Send email to john@example.com with subject "Status" and body "On schedule"`. | Email is **NOT** sent automatically. An **Authorization Required** card pops up in AI panel with preview and **Authorize & send** button. |
| **8** | **AI Multi-Step Tool Chain** | Type: `Search emails about invoice and reply to the sender with "Received, thanks!"`. | Sequential execution: Step 1 filters invoice email, Step 2 opens email, Step 3 displays Authorization Card for reply confirmation. |

---

## 🏗️ SOLID Architecture Adherence

1. **Single Responsibility Principle (SRP)**:
   - `commands/index.ts` $\rightarrow$ UI command orchestration & store state mutations.
   - `gmail/messages.ts` $\rightarrow$ Database persistence & Gmail API client operations.
   - `gmail/parser.ts` $\rightarrow$ Raw MIME payload parsing.
   - `auth/google-oauth.ts` $\rightarrow$ OAuth tokens & AES-256-GCM encryption.
2. **Open/Closed Principle (OCP)**:
   - Extended via schema-based tool registries (`ALL_TOOLS`). New actions can be added without modifying core execution flow.
3. **Liskov Substitution Principle (LSP)**:
   - Strongly typed TypeScript contracts (`EmailMessage`, `EmailFilterParams`, `ComposeDraft`) ensure mock and live Gmail API data are 100% interchangeable.
4. **Interface Segregation Principle (ISP)**:
   - Specific Zod schemas enforce minimal parameter contracts for every individual command.
5. **Dependency Inversion Principle (DIP)**:
   - UI components and AI assistant handlers depend on abstractions (command layer interface & Zustand store) rather than low-level implementations.

---

## 🧪 Testing & Verification Summary

- **Unit Test Suite**: Ran `npm test` (Vitest) $\rightarrow$ **7 out of 7 tests passed**.
- **TypeScript Type Checker**: Ran `npx tsc --noEmit` $\rightarrow$ **0 errors**.
- **Production Build**: Ran `npm run build` $\rightarrow$ **Compiled successfully (`✓ Type checking passed`)**.
- **Version Control**: All features committed and pushed to GitHub main repository:
  - Repository: `https://github.com/AbdulFahad31/nebula-mail.git`

---

## 🚀 How to Run Locally

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Access the application in your browser at: **[http://localhost:3001/inbox](http://localhost:3001/inbox)**.
