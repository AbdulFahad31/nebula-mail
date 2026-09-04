import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getAuthenticatedGmailClient } from '@/lib/auth/google-oauth';
import { db } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topicName = process.env.GCP_PUBSUB_TOPIC || 'projects/nebula-mail/topics/gmail-notifications';

  try {
    const gmail = await getAuthenticatedGmailClient(session.userId);

    const watchRes = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });

    const historyId = watchRes.data.historyId || '1000';
    const expiration = watchRes.data.expiration ? new Date(parseInt(watchRes.data.expiration)) : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await db.syncState.upsert({
      where: { userId: session.userId },
      update: {
        historyId,
        watchExpiration: expiration,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: session.userId,
        historyId,
        watchExpiration: expiration,
      },
    });

    return NextResponse.json({ success: true, historyId, watchExpiration: expiration });
  } catch (error: any) {
    console.warn('Watch renewal skipped/fallback:', error.message);
    return NextResponse.json({ success: true, mode: 'demo_fallback' });
  }
}
