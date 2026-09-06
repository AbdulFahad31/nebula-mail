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
          attachmentsJson: parsed.attachments ? JSON.stringify(parsed.attachments) : null,
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

    await db.syncState.upsert({
      where: { userId },
      update: { lastSyncedAt: new Date() },
      create: { userId, historyId: '1000', lastSyncedAt: new Date() },
    });

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
    attachments: c.attachmentsJson ? JSON.parse(c.attachmentsJson) : undefined,
  }));
}

export async function getEmailsFromCache(
  userId: string,
  filters: EmailFilterParams = {}
): Promise<EmailMessage[]> {
  // Check if user has a connected OAuth account or existing cached emails
  const oauthAccount = await db.oAuthAccount.findUnique({ where: { userId } });
  const count = await db.emailCache.count({ where: { userId } });

  // If cache is empty for this user, trigger sync (if connected to Gmail) or fallback demo seed
  if (count === 0) {
    if (oauthAccount) {
      await syncUserMessagesToCache(userId);
    } else {
      await seedDemoCache(userId);
    }
  }

  const whereClause: any = { userId };

  if (filters.isTrash || filters.view === 'trash') {
    whereClause.labels = { contains: 'TRASH' };
  } else {
    whereClause.NOT = { labels: { contains: 'TRASH' } };
    if (filters.isSent || filters.view === 'sent') {
      whereClause.isSent = true;
    } else {
      whereClause.isSent = false;
    }
  }

  if (filters.isUnread !== undefined) {
    whereClause.isRead = !filters.isUnread;
  }

  if (filters.startDate || filters.after) {
    const afterDate = new Date(filters.startDate || filters.after!);
    whereClause.receivedAt = { ...(whereClause.receivedAt || {}), gte: afterDate };
  }

  if (filters.endDate || filters.before) {
    const beforeDate = new Date(filters.endDate || filters.before!);
    whereClause.receivedAt = { ...(whereClause.receivedAt || {}), lte: beforeDate };
  }

  let cached = await db.emailCache.findMany({
    where: whereClause,
    orderBy: { receivedAt: 'desc' },
  });

  if (filters.sender) {
    const s = filters.sender.toLowerCase();
    cached = cached.filter((c) => c.sender.toLowerCase().includes(s));
  }

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    cached = cached.filter(
      (c) =>
        (c.subject && c.subject.toLowerCase().includes(kw)) ||
        (c.snippet && c.snippet.toLowerCase().includes(kw)) ||
        (c.bodyText && c.bodyText.toLowerCase().includes(kw)) ||
        (c.sender && c.sender.toLowerCase().includes(kw)) ||
        (c.recipient && c.recipient.toLowerCase().includes(kw))
    );
  }

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
    attachments: c.attachmentsJson ? JSON.parse(c.attachmentsJson) : undefined,
  }));
}

export async function sendEmailService(userId: string, draft: ComposeDraft): Promise<EmailMessage> {
  const recipientStr = draft.to.join(', ');
  let finalGmailMsgId = `sent_${Date.now()}`;
  const threadId = draft.threadId || `thread_${Date.now()}`;

  const user = await db.user.findUnique({ where: { id: userId } });
  const senderEmail = user?.email || 'me@nebulamail.app';
  const senderName = user?.name || senderEmail.split('@')[0];

  const hasAttachments = Boolean(draft.attachments && draft.attachments.length > 0);
  const attachmentsJson = hasAttachments ? JSON.stringify(draft.attachments) : null;

  try {
    const gmail = await getAuthenticatedGmailClient(userId);

    let rawMessage: string;
    if (hasAttachments) {
      const boundary = `====_Nebula_Boundary_${Date.now()}_====`;
      const mimeParts: string[] = [
        `From: ${senderName} <${senderEmail}>`,
        `To: ${recipientStr}`,
        `Subject: ${draft.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        `<p>${draft.body.replace(/\n/g, '<br>')}</p>`,
      ];

      for (const att of draft.attachments!) {
        const cleanBase64 = att.base64 ? att.base64.replace(/^data:[^;]+;base64,/, '') : '';
        mimeParts.push(`--${boundary}`);
        mimeParts.push(`Content-Type: ${att.mimeType || 'application/octet-stream'}; name="${att.filename}"`);
        mimeParts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
        mimeParts.push(`Content-Transfer-Encoding: base64`);
        mimeParts.push(``);
        mimeParts.push(cleanBase64);
      }

      mimeParts.push(`--${boundary}--`);
      rawMessage = mimeParts.join('\r\n');
    } else {
      rawMessage = [
        `From: ${senderName} <${senderEmail}>`,
        `To: ${recipientStr}`,
        `Subject: ${draft.subject}`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        ``,
        `<p>${draft.body.replace(/\n/g, '<br>')}</p>`,
      ].join('\r\n');
    }

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
      console.log(`[Gmail API] Live email sent successfully! Message ID: ${res.data.id}`);
      finalGmailMsgId = res.data.id;
      await syncUserMessagesToCache(userId);
    }
  } catch (error: any) {
    console.warn('[Gmail API Send Fallback]:', error?.message || error);
  }

  // Ensure Thread exists in Prisma DB
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

  // Upsert into DB Cache using finalGmailMsgId to avoid duplicate rows
  const created = await db.emailCache.upsert({
    where: { gmailMessageId: finalGmailMsgId },
    update: {
      subject: draft.subject,
      snippet: draft.body.substring(0, 100),
      bodyText: draft.body,
      bodyHtml: `<p>${draft.body.replace(/\n/g, '<br>')}</p>`,
      isSent: true,
      attachmentsJson: attachmentsJson || undefined,
    },
    create: {
      userId,
      gmailMessageId: finalGmailMsgId,
      threadId,
      sender: `${senderName} <${senderEmail}>`,
      recipient: recipientStr,
      subject: draft.subject,
      snippet: draft.body.substring(0, 100),
      bodyText: draft.body,
      bodyHtml: `<p>${draft.body.replace(/\n/g, '<br>')}</p>`,
      receivedAt: new Date(),
      isRead: true,
      isSent: true,
      labels: 'SENT',
      attachmentsJson,
    },
  });

  return {
    id: created.id,
    gmailMessageId: created.gmailMessageId,
    threadId: created.threadId,
    sender: created.sender,
    senderName,
    senderEmail,
    recipient: created.recipient,
    subject: created.subject,
    snippet: created.snippet,
    bodyText: created.bodyText || '',
    bodyHtml: created.bodyHtml || '',
    receivedAt: created.receivedAt.toISOString(),
    isRead: created.isRead,
    isSent: created.isSent,
    labels: ['SENT'],
    attachments: draft.attachments,
  };
}

export async function syncGmailHistory(userId: string, targetHistoryId?: string): Promise<boolean> {
  try {
    const syncState = await db.syncState.findUnique({ where: { userId } });
    const startHistoryId = syncState?.historyId;

    if (!startHistoryId) {
      await syncUserMessagesToCache(userId);
      return true;
    }

    const gmail = await getAuthenticatedGmailClient(userId);

    const historyRes = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded', 'labelAdded', 'labelRemoved'],
    });

    const historyRecords = historyRes.data.history || [];

    for (const record of historyRecords) {
      if (record.messagesAdded) {
        for (const msgAdded of record.messagesAdded) {
          if (!msgAdded.message?.id) continue;
          const fullMsg = await gmail.users.messages.get({
            userId: 'me',
            id: msgAdded.message.id,
            format: 'full',
          });
          const parsed = parseGmailMessage(fullMsg.data);
          const labelsStr = Array.isArray(parsed.labels) ? parsed.labels.join(',') : parsed.labels || 'INBOX';

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
      }
    }

    const newHistoryId = targetHistoryId || historyRes.data.historyId || startHistoryId;
    await db.syncState.upsert({
      where: { userId },
      update: { historyId: newHistoryId, lastSyncedAt: new Date() },
      create: { userId, historyId: newHistoryId },
    });

    return true;
  } catch (error) {
    console.warn('[syncGmailHistory] Fallback to full sync due to error:', error);
    await syncUserMessagesToCache(userId);
    return false;
  }
}

export async function renewGmailWatchIfNeeded(userId: string): Promise<void> {
  try {
    const syncState = await db.syncState.findUnique({ where: { userId } });
    const now = new Date();
    const needsRenewal =
      !syncState?.watchExpiration ||
      syncState.watchExpiration.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

    if (needsRenewal) {
      const topicName = process.env.GCP_PUBSUB_TOPIC || 'projects/nebula-mail/topics/gmail-notifications';
      const gmail = await getAuthenticatedGmailClient(userId);
      const watchRes = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName,
          labelIds: ['INBOX'],
        },
      });

      const historyId = watchRes.data.historyId || syncState?.historyId || '1000';
      const expiration = watchRes.data.expiration
        ? new Date(parseInt(watchRes.data.expiration))
        : new Date(Date.now() + 7 * 24 * 3600 * 1000);

      await db.syncState.upsert({
        where: { userId },
        update: {
          historyId,
          watchExpiration: expiration,
          lastSyncedAt: new Date(),
        },
        create: {
          userId,
          historyId,
          watchExpiration: expiration,
        },
      });
    }
  } catch (error: any) {
    console.warn(`[Watch Renewal] Skipped/fallback for ${userId}:`, error.message);
  }
}

export async function trashEmailService(userId: string, emailId: string): Promise<boolean> {
  const email = await db.emailCache.findFirst({
    where: { userId, OR: [{ id: emailId }, { gmailMessageId: emailId }] },
  });
  if (!email) return false;
  try {
    const gmail = await getAuthenticatedGmailClient(userId);
    await gmail.users.messages.trash({ userId: 'me', id: email.gmailMessageId });
    console.log('[Gmail API] Message trashing synced for ' + email.gmailMessageId);
  } catch (err: any) {
    console.warn('[Gmail API Trash Fallback]:', err.message);
  }
  await db.emailCache.update({
    where: { id: email.id },
    data: { labels: 'TRASH' },
  });
  return true;
}

export async function untrashEmailService(userId: string, emailId: string): Promise<boolean> {
  const email = await db.emailCache.findFirst({
    where: { userId, OR: [{ id: emailId }, { gmailMessageId: emailId }] },
  });
  if (!email) return false;
  try {
    const gmail = await getAuthenticatedGmailClient(userId);
    await gmail.users.messages.untrash({ userId: 'me', id: email.gmailMessageId });
    console.log('[Gmail API] Message untrashing synced for ' + email.gmailMessageId);
  } catch (err: any) {
    console.warn('[Gmail API Untrash Fallback]:', err.message);
  }
  const restoredLabel = email.isSent ? 'SENT' : 'INBOX';
  await db.emailCache.update({
    where: { id: email.id },
    data: { labels: restoredLabel },
  });
  return true;
}

export async function permanentlyDeleteEmailService(userId: string, emailId: string): Promise<boolean> {
  const email = await db.emailCache.findFirst({
    where: { userId, OR: [{ id: emailId }, { gmailMessageId: emailId }] },
  });
  if (!email) return false;
  try {
    const gmail = await getAuthenticatedGmailClient(userId);
    await gmail.users.messages.delete({ userId: 'me', id: email.gmailMessageId });
    console.log('[Gmail API] Message permanent deletion synced for ' + email.gmailMessageId);
  } catch (err: any) {
    console.warn('[Gmail API Delete Fallback]:', err.message);
  }
  await db.emailCache.deleteMany({
    where: { userId, OR: [{ id: email.id }, { gmailMessageId: email.gmailMessageId }] },
  });
  return true;
}

export async function markEmailAsReadService(userId: string, emailId: string): Promise<boolean> {
  const email = await db.emailCache.findFirst({
    where: { userId, OR: [{ id: emailId }, { gmailMessageId: emailId }] },
  });
  if (!email) return false;

  if (!email.isRead) {
    try {
      const gmail = await getAuthenticatedGmailClient(userId);
      await gmail.users.messages.modify({
        userId: 'me',
        id: email.gmailMessageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
      console.log('[Gmail API] Message mark-as-read synced for ' + email.gmailMessageId);
    } catch (err: any) {
      console.warn('[Gmail API Mark As Read Fallback]:', err?.message || err);
    }

    await db.emailCache.update({
      where: { id: email.id },
      data: { isRead: true },
    });
  }
  return true;
}
