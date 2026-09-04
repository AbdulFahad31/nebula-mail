import { getAuthenticatedGmailClient } from '@/lib/auth/google-oauth';
import { parseGmailMessage } from './parser';
import { EmailMessage, EmailFilterParams, ComposeDraft } from './types';
import { db } from '@/lib/db/prisma';
import { INITIAL_MOCK_EMAILS } from './mock-data';

export async function syncUserMessagesToCache(userId: string): Promise<EmailMessage[]> {
  try {
    const gmail = await getAuthenticatedGmailClient(userId);

    // List recent 50 messages from Gmail API
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    const parsedEmails: EmailMessage[] = [];

    for (const msgRef of messages) {
      if (!msgRef.id) continue;
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msgRef.id,
        format: 'full',
      });

      const parsed = parseGmailMessage(fullMsg.data);
      parsedEmails.push(parsed);

      const labelsStr = Array.isArray(parsed.labels) ? parsed.labels.join(',') : parsed.labels || 'INBOX';

      // Ensure Thread exists in DB
      await db.thread.upsert({
        where: { gmailThreadId: parsed.threadId },
        update: {
          subject: parsed.subject,
          snippet: parsed.snippet,
          participantSummary: parsed.senderName || parsed.sender,
          updatedAt: new Date(parsed.receivedAt),
        },
        create: {
          userId,
          gmailThreadId: parsed.threadId,
          subject: parsed.subject,
          snippet: parsed.snippet,
          participantSummary: parsed.senderName || parsed.sender,
          updatedAt: new Date(parsed.receivedAt),
        },
      });

      // Upsert Email in DB Cache
      await db.emailCache.upsert({
        where: { gmailMessageId: parsed.gmailMessageId },
        update: {
          sender: parsed.sender,
          recipient: parsed.recipient,
          subject: parsed.subject,
          snippet: parsed.snippet,
          bodyText: parsed.bodyText,
          bodyHtml: parsed.bodyHtml,
          receivedAt: new Date(parsed.receivedAt),
          isRead: parsed.isRead,
          isSent: parsed.isSent,
          labels: labelsStr,
        },
        create: {
          userId,
          gmailMessageId: parsed.gmailMessageId,
          threadId: parsed.threadId,
          sender: parsed.sender,
          recipient: parsed.recipient,
          subject: parsed.subject,
          snippet: parsed.snippet,
          bodyText: parsed.bodyText,
          bodyHtml: parsed.bodyHtml,
          receivedAt: new Date(parsed.receivedAt),
          isRead: parsed.isRead,
          isSent: parsed.isSent,
          labels: labelsStr,
        },
      });
    }

    return parsedEmails;
  } catch (error) {
    console.warn('Gmail API sync unavailable or non-OAuth user, seeding demo cache:', error);
    return await seedDemoCache(userId);
  }
}

export async function seedDemoCache(userId: string): Promise<EmailMessage[]> {
  // Ensure User record exists to satisfy foreign key constraints
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: userId.includes('@') ? userId : `${userId}@nebulamail.app`,
      name: 'Nebula User',
    },
  });

  for (const email of INITIAL_MOCK_EMAILS) {
    const labelsStr = Array.isArray(email.labels) ? email.labels.join(',') : email.labels || 'INBOX';
    const userThreadId = `${email.threadId}_${userId}`;
    const userMsgId = `${email.gmailMessageId}_${userId}`;

    await db.thread.upsert({
      where: { gmailThreadId: userThreadId },
      update: {
        subject: email.subject,
        snippet: email.snippet,
        participantSummary: email.senderName || email.sender,
        updatedAt: new Date(email.receivedAt),
      },
      create: {
        userId,
        gmailThreadId: userThreadId,
        subject: email.subject,
        snippet: email.snippet,
        participantSummary: email.senderName || email.sender,
        updatedAt: new Date(email.receivedAt),
      },
    });

    await db.emailCache.upsert({
      where: { gmailMessageId: userMsgId },
      update: {
        subject: email.subject,
        snippet: email.snippet,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
      },
      create: {
        userId,
        gmailMessageId: userMsgId,
        threadId: userThreadId,
        sender: email.sender,
        recipient: email.recipient,
        subject: email.subject,
        snippet: email.snippet,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
        receivedAt: new Date(email.receivedAt),
        isRead: email.isRead,
        isSent: email.isSent,
        labels: labelsStr,
      },
    });
  }

  const cached = await db.emailCache.findMany({
    where: { userId },
    orderBy: { receivedAt: 'desc' },
  });

  return cached.map((c) => ({
    id: c.id,
    gmailMessageId: c.gmailMessageId,
    threadId: c.threadId,
    sender: c.sender,
    senderName: c.sender.split('<')[0].trim(),
    senderEmail: c.sender.includes('<') ? c.sender.match(/<([^>]+)>/)?.[1] || c.sender : c.sender,
    recipient: c.recipient,
    subject: c.subject,
    snippet: c.snippet,
    bodyText: c.bodyText || '',
    bodyHtml: c.bodyHtml || '',
    receivedAt: c.receivedAt.toISOString(),
    isRead: c.isRead,
    isSent: c.isSent,
    labels: typeof c.labels === 'string' ? c.labels.split(',') : (c.labels as any) || [],
  }));
}

export async function getEmailsFromCache(
  userId: string,
  filters: EmailFilterParams = {}
): Promise<EmailMessage[]> {
  // Ensure DB cache has emails
  await seedDemoCache(userId);

  const whereClause: any = { userId };

  if (filters.isSent) {
    whereClause.isSent = true;
  } else {
    whereClause.isSent = false;
  }

  if (filters.isUnread !== undefined) {
    whereClause.isRead = !filters.isUnread;
  }

  if (filters.sender) {
    whereClause.sender = { contains: filters.sender };
  }

  if (filters.keyword) {
    whereClause.OR = [
      { subject: { contains: filters.keyword } },
      { snippet: { contains: filters.keyword } },
      { bodyText: { contains: filters.keyword } },
      { sender: { contains: filters.keyword } },
    ];
  }

  if (filters.startDate || filters.after) {
    const afterDate = new Date(filters.startDate || filters.after!);
    whereClause.receivedAt = { ...(whereClause.receivedAt || {}), gte: afterDate };
  }

  if (filters.endDate || filters.before) {
    const beforeDate = new Date(filters.endDate || filters.before!);
    whereClause.receivedAt = { ...(whereClause.receivedAt || {}), lte: beforeDate };
  }

  const cached = await db.emailCache.findMany({
    where: whereClause,
    orderBy: { receivedAt: 'desc' },
  });

  return cached.map((c) => ({
    id: c.id,
    gmailMessageId: c.gmailMessageId,
    threadId: c.threadId,
    sender: c.sender,
    senderName: c.sender.split('<')[0].trim(),
    senderEmail: c.sender.includes('<') ? c.sender.match(/<([^>]+)>/)?.[1] || c.sender : c.sender,
    recipient: c.recipient,
    subject: c.subject,
    snippet: c.snippet,
    bodyText: c.bodyText || '',
    bodyHtml: c.bodyHtml || '',
    receivedAt: c.receivedAt.toISOString(),
    isRead: c.isRead,
    isSent: c.isSent,
    labels: typeof c.labels === 'string' ? c.labels.split(',') : (c.labels as any) || [],
  }));
}

export async function sendEmailService(userId: string, draft: ComposeDraft): Promise<EmailMessage> {
  const recipientStr = draft.to.join(', ');
  const newMsgId = `sent_${Date.now()}`;
  const threadId = draft.threadId || `thread_${Date.now()}`;

  try {
    const gmail = await getAuthenticatedGmailClient(userId);

    const rawMessage = [
      `To: ${recipientStr}`,
      `Subject: ${draft.subject}`,
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
      ``,
      `<p>${draft.body.replace(/\n/g, '<br>')}</p>`,
    ].join('\r\n');

    const base64Encoded = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64Encoded,
        threadId: draft.threadId,
      },
    });

    if (res.data.id) {
      // Refresh DB Cache
      await syncUserMessagesToCache(userId);
    }
  } catch (error) {
    console.warn('Gmail API send fallback to local cache:', error);
  }

  // Record in Prisma DB
  await db.thread.upsert({
    where: { gmailThreadId: threadId },
    update: { updatedAt: new Date() },
    create: {
      userId,
      gmailThreadId: threadId,
      subject: draft.subject,
      snippet: draft.body.substring(0, 100),
      participantSummary: recipientStr,
    },
  });

  const created = await db.emailCache.create({
    data: {
      userId,
      gmailMessageId: newMsgId,
      threadId,
      sender: 'me@nebulamail.app',
      recipient: recipientStr,
      subject: draft.subject,
      snippet: draft.body.substring(0, 100),
      bodyText: draft.body,
      bodyHtml: `<p>${draft.body.replace(/\n/g, '<br>')}</p>`,
      receivedAt: new Date(),
      isRead: true,
      isSent: true,
      labels: 'SENT',
    },
  });

  return {
    id: created.id,
    gmailMessageId: created.gmailMessageId,
    threadId: created.threadId,
    sender: created.sender,
    senderName: 'Me',
    senderEmail: 'me@nebulamail.app',
    recipient: created.recipient,
    subject: created.subject,
    snippet: created.snippet,
    bodyText: created.bodyText || '',
    bodyHtml: created.bodyHtml || '',
    receivedAt: created.receivedAt.toISOString(),
    isRead: created.isRead,
    isSent: created.isSent,
    labels: typeof created.labels === 'string' ? created.labels.split(',') : (created.labels as any) || [],
  };
}
