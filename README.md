# Nebula Mail

Nebula Mail is a web-based email client, connected to a real Gmail account, where an AI assistant operates the interface directly rather than just answering questions about it. Asking the assistant to search, filter, compose, or reply causes the actual inbox, filters, and compose form to update in the UI — the same way a person clicking through the app would.

Built for the Nebula KnowLab AI-Powered Mail Web App hiring assignment.

## Screenshots

**Real Gmail data with the assistant's action timeline.** The inbox shows live messages from a connected account, including one with a full recipient list of 60+ addresses parsed and displayed correctly. The right panel logs each step the assistant takes as it works.

![Inbox with real Gmail data and the AI action timeline](./screenshots/01-inbox-and-action-timeline.png)

**Third-party HTML rendered without breaking the app's own styling.** Marketing emails and newsletters bring their own CSS and layout. This one is isolated in its own sandboxed container, sized to its actual content, with no bleed into the surrounding interface.

![A newsletter email rendered with its original formatting preserved](./screenshots/02-original-formatting-preserved.png)

**Compose, with file attachments.** The compose window supports selecting files from the device and attaching them before sending, in addition to the standard To/Subject/body fields.

![The compose modal open with an attach option, layered over an email in the reading pane](./screenshots/03-compose-with-attachments.png)

**Account switching and the Sent view.** Sent messages are labeled by recipient rather than by the account's own address, and the account menu supports switching or disconnecting a connected Google account.

![The account switcher menu open above the Sent folder, showing recipient-labeled rows](./screenshots/04-account-switcher-and-sent-view.png)

## What it does

- **Inbox, Sent, and Trash** backed by real Gmail data, with read/unread state, recoverable delete (moves to Gmail's actual Trash) and restore, and a separate confirmation step for permanent deletion.
- **Compose**, with support for attaching files from the device and sending real multipart MIME messages through the Gmail API.
- **Search and filtering**, both through ordinary UI controls and through natural language, backed by the same underlying logic in both cases.
- **An AI assistant panel** that can search, open, filter, compose, and reply by invoking the same application commands a manual click would — not by describing what it would do. Any outgoing message it prepares is held behind a confirmation step before it's actually sent.
- **A resizable three-pane layout** (navigation, message list, reading pane / assistant), with panel sizes remembered across sessions.
- **Nebula Brief**, an on-demand summary of the open email: a short synopsis, extracted action items, any stated deadline, and a one-click drafted reply.

## Architecture

Every interaction — a click in the UI or an instruction to the assistant — goes through the same command layer before touching Gmail:

```
UI click  ──┐
             ├──▶  Command layer  ──▶  Gmail service  ──▶  Gmail API
AI request ──┘            │
                           ▼
                     Application state ──▶ UI updates
```

The AI assistant never calls the Gmail API directly. It calls a fixed set of commands (`search_emails`, `open_email`, `apply_email_filter`, `open_compose`, `populate_compose`, `send_email`, `reply_to_email`, `forward_email`), each validated with Zod, and those commands are the same ones the manual UI controls call. This keeps the two paths provably consistent and means a bug fix in one covers both.

Server state (emails, threads, search results) is held in TanStack Query; UI-only state (selected email, open panels, filter chips, compose drawer) is kept separately in Zustand.

## AI provider fallback

AI calls (the assistant and Nebula Brief) go through a small provider chain rather than depending on a single API:

1. Gemini (primary)
2. Groq
3. TokenRouter
4. A local, non-API extractive fallback, so the app degrades to a simpler result instead of failing outright if all three external providers are unavailable

Each provider implements the same interface and returns a normalized response, so neither the command layer nor Nebula Brief needs to know which one actually handled a given request. Only failures classified as retryable (rate limits, server errors, timeouts) advance to the next provider; configuration errors like a bad key are surfaced immediately rather than masked by a fallback.

## Real-time sync

New mail arriving from outside the app is delivered via Gmail's push mechanism: a registered mailbox watch notifies a Cloud Pub/Sub topic, which pushes to a webhook in this app, which fetches only what changed since the last sync and updates the UI over Server-Sent Events. Gmail watches expire and are renewed automatically.

Pub/Sub push requires a publicly reachable HTTPS endpoint, which isn't available on a plain `localhost` dev server. For local development, the app additionally polls for changes every 20 seconds so new mail still appears without a manual refresh; this fallback isn't needed once the app is deployed somewhere with a real public URL.

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Zustand · TanStack Query · Prisma · Gmail REST API · Google OAuth 2.0 · Google Cloud Pub/Sub · Server-Sent Events · Zod · Vitest · Playwright

## Setup

### Prerequisites

- Node.js 18 or later
- npm

### 1. Install and configure

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/callback/google"

GEMINI_API_KEY="your-gemini-api-key"
GROQ_API_KEY="your-groq-api-key"
TOKEN_ROUTER_API_KEY="your-token-router-api-key"

AUTH_SECRET="a-random-32-character-or-longer-string"
ENCRYPTION_SECRET="a-32-byte-hex-string-for-aes-256-gcm"
```

### 2. Google OAuth (Gmail access)

1. In the [Google Cloud Console](https://console.cloud.google.com), create or select a project and enable the **Gmail API**.
2. Configure the OAuth consent screen, adding the Gmail scopes the app needs (read, send, and modify).
3. Under **Credentials**, create an **OAuth 2.0 Client ID** for a web application, and add `http://localhost:3001/api/auth/callback/google` as an authorized redirect URI (update this to the real deployed URL later if the app is hosted elsewhere).
4. Copy the client ID and secret into `.env`.

### 3. Google Cloud Pub/Sub (real-time push)

1. Enable the **Cloud Pub/Sub API** in the same project.
2. Create a topic (for example `gmail-notifications`).
3. Grant the Gmail push service account, `gmail-api-push@system.gserviceaccount.com`, the **Pub/Sub Publisher** role on that topic.
4. Create a push subscription on the topic, with the endpoint set to `https://<your-domain>/api/webhooks/gmail`.
5. For local development, expose `localhost:3001` with a tunnel (e.g. `ngrok http 3001`) and point the subscription at the tunnel's HTTPS URL — Pub/Sub can't push to `localhost` directly. Without this, the app still works via its polling fallback.

### 4. Database and run

```bash
npx prisma db push
npm run dev
```

Open `http://localhost:3001`.

## Testing

```bash
npx tsc --noEmit      # type check
npm test               # unit tests (Vitest)
npx playwright test    # end-to-end tests
npm run build           # production build check
```

## Design decisions and trade-offs

**SQLite instead of PostgreSQL.** The brief specified Postgres; this project uses SQLite through Prisma for local development and evaluation, since it needs no separate database service to set up. The schema is Prisma-managed, so switching the datasource to Postgres for a real deployment is a configuration change, not a rewrite — connection pooling and concurrent-write handling would need attention at that point, which SQLite doesn't require locally.

**A single command layer instead of separate UI and AI code paths.** Routing both manual actions and AI tool calls through the same functions costs a bit of extra abstraction up front, but means the assistant can never drift out of sync with what the UI itself is capable of.

**Trash instead of permanent delete as the default.** Deleting a message moves it to Gmail's actual Trash rather than removing it outright, matching what Gmail itself does and giving a recovery path before anything is irreversible.

## Future improvements

- Thread/conversation view grouping related messages
- Reply and forward available directly from the assistant's natural-language flow, not only manually
- A deployed instance with a stable public URL, removing the need for the local polling fallback
- Server-side pagination tuning for very large mailboxes
