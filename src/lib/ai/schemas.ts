import { z } from 'zod';

export const SearchEmailsArgs = z.object({
  from: z.string().optional().describe('Sender name or email address'),
  to: z.string().optional().describe('Recipient email address'),
  subject: z.string().optional().describe('Subject keyword'),
  keyword: z.string().optional().describe('General search keyword in body or title'),
  after: z.string().optional().describe('ISO date or YYYY-MM-DD for emails received after this date'),
  before: z.string().optional().describe('ISO date or YYYY-MM-DD for emails received before this date'),
  isUnread: z.boolean().optional().describe('Filter by unread status'),
});

export const OpenEmailArgs = z.object({
  messageId: z.string().describe('The ID of the email message to open in full detail view'),
});

export const ApplyEmailFilterArgs = z.object({
  isUnread: z.boolean().optional().describe('Filter by unread status'),
  sender: z.string().optional().describe('Filter by sender name or email'),
  keyword: z.string().optional().describe('Filter by keyword'),
  startDate: z.string().optional().describe('Filter start date (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('Filter end date (YYYY-MM-DD)'),
});

export const OpenComposeArgs = z.object({});

export const PopulateComposeArgs = z.object({
  to: z.array(z.string()).describe('Array of recipient email addresses'),
  subject: z.string().describe('Subject line for the email'),
  body: z.string().describe('Body message text for the email'),
});

export const SendEmailArgs = z.object({
  composeDraftId: z.string().describe('Current compose draft ID to send'),
});

export const ReplyToEmailArgs = z.object({
  messageId: z.string().optional().describe('Optional target email ID to reply to (if blank, uses currently opened email)'),
  body: z.string().describe('Reply body message content'),
});

export const ForwardEmailArgs = z.object({
  messageId: z.string().optional().describe('Optional target email ID to forward'),
  to: z.array(z.string()).describe('Array of recipient email addresses'),
});
