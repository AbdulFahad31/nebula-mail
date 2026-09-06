import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { markEmailAsReadService } from '@/lib/gmail/messages';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const userId = session?.userId || 'demo_user_id';
  const { id } = await params;

  try {
    const email = await db.emailCache.findFirst({
      where: {
        userId,
        OR: [{ id }, { gmailMessageId: id }],
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Mark as read when retrieved & remove UNREAD label in Gmail API
    if (!email.isRead) {
      await markEmailAsReadService(userId, email.id);
    }

    return NextResponse.json({
      email: {
        id: email.id,
        gmailMessageId: email.gmailMessageId,
        threadId: email.threadId,
        sender: email.sender,
        senderName: email.sender.split('<')[0].trim(),
        senderEmail: email.sender.includes('<') ? email.sender.match(/<([^>]+)>/)?.[1] || email.sender : email.sender,
        recipient: email.recipient,
        subject: email.subject,
        snippet: email.snippet,
        bodyText: email.bodyText || '',
        bodyHtml: email.bodyHtml || '',
        receivedAt: email.receivedAt.toISOString(),
        isRead: true,
        isSent: email.isSent,
        labels: email.labels,
        attachments: email.attachmentsJson ? JSON.parse(email.attachmentsJson) : undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
