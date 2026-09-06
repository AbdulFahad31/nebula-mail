import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { syncGmailHistory, syncUserMessagesToCache, renewGmailWatchIfNeeded } from '@/lib/gmail/messages';
import { broadcastSyncEvent } from '../../webhooks/sse-emitter';
import { db } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId || 'demo_user_id';

    // Check if user has connected OAuth account
    const oauthAccount = await db.oAuthAccount.findUnique({ where: { userId } });

    if (oauthAccount) {
      await renewGmailWatchIfNeeded(userId);
      await syncGmailHistory(userId);
    }

    const syncState = await db.syncState.findUnique({ where: { userId } });
    const lastSyncedAt = syncState?.lastSyncedAt?.toISOString() || new Date().toISOString();

    // Broadcast SSE update so TanStack Query invalidates 'emails' across client tabs
    broadcastSyncEvent({
      type: 'INBOX_UPDATED',
      userId,
      timestamp: lastSyncedAt,
    });

    return NextResponse.json({
      success: true,
      lastSyncedAt,
      isOAuthConnected: Boolean(oauthAccount),
    });
  } catch (error: any) {
    console.error('[API Sync Refresh Error]:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
