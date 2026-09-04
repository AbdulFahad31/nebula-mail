export interface EmailMessage {
  id: string;
  gmailMessageId: string;
  threadId: string;
  sender: string;
  senderName?: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  snippet: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string; // ISO String
  isRead: boolean;
  isSent: boolean;
  labels: string[];
}

export interface ThreadItem {
  id: string;
  gmailThreadId: string;
  subject: string;
  snippet: string;
  participantSummary: string;
  updatedAt: string;
  emails: EmailMessage[];
}

export interface EmailFilterParams {
  keyword?: string;
  sender?: string;
  from?: string;
  to?: string;
  subject?: string;
  isUnread?: boolean;
  isSent?: boolean;
  startDate?: string;
  endDate?: string;
  after?: string;
  before?: string;
}

export interface ComposeDraft {
  to: string[];
  subject: string;
  body: string;
  replyToMessageId?: string;
  threadId?: string;
}
