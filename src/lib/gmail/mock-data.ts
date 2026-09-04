import { EmailMessage } from './types';

const now = new Date();

function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const INITIAL_MOCK_EMAILS: EmailMessage[] = [
  {
    id: 'msg_sarah_01',
    gmailMessageId: 'msg_sarah_01',
    threadId: 'thread_sarah_01',
    sender: 'Sarah Jenkins <sarah@nebulamail.app>',
    senderName: 'Sarah Jenkins',
    senderEmail: 'sarah@nebulamail.app',
    recipient: 'me@nebulamail.app',
    subject: 'Q3 Nebula Project Update & Next Steps',
    snippet: 'Hi team, here is the latest progress report on the AI mail integration and Q3 roadmap priorities.',
    bodyText: `Hi team,

I wanted to share the latest progress report on the AI mail integration and Q3 roadmap priorities.

Key highlights this week:
- Completed unified command layer implementation.
- Real-time Pub/Sub push notification pipeline setup.
- UI redesign with Instrument Serif typography and dark mode.

Please review the attached specs and let me know if you have any questions before our sync tomorrow!

Best,
Sarah`,
    bodyHtml: `<p>Hi team,</p><p>I wanted to share the latest progress report on the AI mail integration and Q3 roadmap priorities.</p><ul><li>Completed unified command layer implementation.</li><li>Real-time Pub/Sub push notification pipeline setup.</li><li>UI redesign with Instrument Serif typography and dark mode.</li></ul><p>Please review the attached specs and let me know if you have any questions before our sync tomorrow!</p><p>Best,<br>Sarah</p>`,
    receivedAt: daysAgo(1),
    isRead: false,
    isSent: false,
    labels: ['INBOX', 'UNREAD'],
  },
  {
    id: 'msg_john_02',
    gmailMessageId: 'msg_john_02',
    threadId: 'thread_john_02',
    sender: 'John Miller <john@example.com>',
    senderName: 'John Miller',
    senderEmail: 'john@example.com',
    recipient: 'me@nebulamail.app',
    subject: 'Meeting Tomorrow',
    snippet: 'Hey! Are we still on for our sync tomorrow afternoon at 3pm?',
    bodyText: `Hey! Are we still on for our sync tomorrow afternoon at 3pm? Let me know if you need to reschedule.`,
    bodyHtml: `<p>Hey! Are we still on for our sync tomorrow afternoon at 3pm? Let me know if you need to reschedule.</p>`,
    receivedAt: daysAgo(2),
    isRead: true,
    isSent: false,
    labels: ['INBOX'],
  },
  {
    id: 'msg_alex_03',
    gmailMessageId: 'msg_alex_03',
    threadId: 'thread_alex_03',
    sender: 'Alex Rivera <alex.rivera@techcorp.io>',
    senderName: 'Alex Rivera',
    senderEmail: 'alex.rivera@techcorp.io',
    recipient: 'me@nebulamail.app',
    subject: 'Security Audit & Compliance Signoff',
    snippet: 'The external security audit for OAuth token encryption and Zod schemas has passed with zero critical findings.',
    bodyText: `Hello,

The external security audit for OAuth token encryption and Zod schemas has passed with zero critical findings.

All refresh tokens are AES-256-GCM encrypted, and all API endpoints are validated against Zod schemas.

Great work team!`,
    bodyHtml: `<p>Hello,</p><p>The external security audit for OAuth token encryption and Zod schemas has passed with zero critical findings.</p><p>All refresh tokens are AES-256-GCM encrypted, and all API endpoints are validated against Zod schemas.</p><p>Great work team!</p>`,
    receivedAt: daysAgo(5),
    isRead: false,
    isSent: false,
    labels: ['INBOX', 'UNREAD'],
  },
  {
    id: 'msg_sent_04',
    gmailMessageId: 'msg_sent_04',
    threadId: 'thread_sent_04',
    sender: 'me@nebulamail.app',
    senderName: 'Me',
    senderEmail: 'me@nebulamail.app',
    recipient: 'john@example.com',
    subject: 'Re: Meeting Tomorrow',
    snippet: 'Sounds great, see you tomorrow at 3pm!',
    bodyText: `Sounds great, see you tomorrow at 3pm!`,
    bodyHtml: `<p>Sounds great, see you tomorrow at 3pm!</p>`,
    receivedAt: daysAgo(2),
    isRead: true,
    isSent: true,
    labels: ['SENT'],
  },
  {
    id: 'msg_old_05',
    gmailMessageId: 'msg_old_05',
    threadId: 'thread_old_05',
    sender: 'GitHub <notifications@github.com>',
    senderName: 'GitHub',
    senderEmail: 'notifications@github.com',
    recipient: 'me@nebulamail.app',
    subject: '[AbdulFahad31/nebula-mail] Pull Request #1 Merged',
    snippet: 'Initial repository setup and Prisma database schema merged to main.',
    bodyText: 'Initial repository setup and Prisma database schema merged to main.',
    bodyHtml: '<p>Initial repository setup and Prisma database schema merged to main.</p>',
    receivedAt: daysAgo(12),
    isRead: true,
    isSent: false,
    labels: ['INBOX'],
  },
];
