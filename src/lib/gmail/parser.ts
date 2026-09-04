import { gmail_v1 } from 'googleapis';
import { EmailMessage } from './types';

export function parseGmailMessage(msg: gmail_v1.Schema$Message): EmailMessage {
  const payload = msg.payload;
  const headers = payload?.headers || [];

  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  const rawFrom = getHeader('From');
  const recipient = getHeader('To');
  const subject = getHeader('Subject') || '(No Subject)';
  const dateHeader = getHeader('Date');

  let senderName = rawFrom;
  let senderEmail = rawFrom;

  const match = rawFrom.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    senderName = match[1] || match[2];
    senderEmail = match[2];
  }

  const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
  const labels = msg.labelIds || [];
  const isRead = !labels.includes('UNREAD');
  const isSent = labels.includes('SENT');

  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part: gmail_v1.Schema$MessagePart) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += Buffer.from(part.body.data, 'base64url').toString('utf8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml += Buffer.from(part.body.data, 'base64url').toString('utf8');
    }

    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  if (payload) {
    extractBody(payload);
  }

  return {
    id: msg.id!,
    gmailMessageId: msg.id!,
    threadId: msg.threadId || msg.id!,
    sender: rawFrom,
    senderName,
    senderEmail,
    recipient,
    subject,
    snippet: msg.snippet || '',
    bodyText: bodyText || msg.snippet || '',
    bodyHtml: bodyHtml || `<p>${bodyText || msg.snippet || ''}</p>`,
    receivedAt,
    isRead,
    isSent,
    labels,
  };
}
