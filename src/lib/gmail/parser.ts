import { gmail_v1 } from 'googleapis';
import { EmailMessage, EmailAttachment } from './types';

export function parseGmailMessage(msg: gmail_v1.Schema$Message): EmailMessage {
  const payload = msg.payload;
  const headers = payload?.headers || [];

  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  const rawFrom = getHeader('From');
  const recipient = getHeader('To');
  const cc = getHeader('Cc') || undefined;
  const subject = getHeader('Subject') || '(No Subject)';
  const dateHeader = getHeader('Date');

  let senderName = rawFrom;
  let senderEmail = rawFrom;

  const match = rawFrom.match(/^(?:"?([^"]*)"?s)?<([^>]+)>$/);
  if (match) {
    senderName = (match[1] || match[2]).trim();
    senderEmail = match[2].trim();
  }

  const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
  const labels = msg.labelIds || [];
  const isRead = !labels.includes('UNREAD');
  const isSent = labels.includes('SENT');

  let bodyText = '';
  let bodyHtml = '';
  const attachments: EmailAttachment[] = [];

  const extractContent = (part: gmail_v1.Schema$MessagePart) => {
    if (part.filename && part.filename.trim().length > 0) {
      attachments.push({
        id: part.body?.attachmentId || `att_${Math.random().toString(36).substring(2, 9)}`,
        attachmentId: part.body?.attachmentId || undefined,
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body?.size || 0,
      });
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += Buffer.from(part.body.data, 'base64url').toString('utf8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml += Buffer.from(part.body.data, 'base64url').toString('utf8');
    }

    if (part.parts) {
      part.parts.forEach(extractContent);
    }
  };

  if (payload) {
    extractContent(payload);
  }

  return {
    id: msg.id!,
    gmailMessageId: msg.id!,
    threadId: msg.threadId || msg.id!,
    sender: rawFrom,
    senderName,
    senderEmail,
    recipient,
    cc,
    subject,
    snippet: msg.snippet || '',
    bodyText: bodyText || msg.snippet || '',
    bodyHtml: bodyHtml || `<p>${bodyText || msg.snippet || ''}</p>`,
    receivedAt,
    isRead,
    isSent,
    labels,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}
