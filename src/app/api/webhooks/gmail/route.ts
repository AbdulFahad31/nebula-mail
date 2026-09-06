import { NextRequest, NextResponse } from 'next/server';
import { syncGmailHistory } from '@/lib/gmail/messages';
import { broadcastSyncEvent } from '../sse-emitter';
import { db } from '@/lib/db/prisma';

/**
 * Gmail Google Cloud Pub/Sub Push Webhook
 *
 * NOTE FOR LOCAL DEVELOPMENT:
 * Google Cloud Pub/Sub requires a publicly accessible HTTPS endpoint (e.g., https://your-domain.com/api/webhooks/gmail).
 * When running locally on http://localhost:3001, Google Pub/Sub cannot physically reach localhost directly.
 *
 * For real-time push testing on localhost:
 * Use a tunneling tool like ngrok (`ngrok http 3001`) or Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3001`)
 * and configure the Pub/Sub subscription push endpoint URL in Google Cloud Console to point to your tunnel URL.
 *
 * POLLING FALLBACK:
 * Nebula Mail includes an automatic 20-second client-side polling fallback (/api/sync/refresh) and a manual re-sync button
 * so that new incoming emails are always fetched seamlessly even when push notifications are unreachable (as on local dev).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify Pub/Sub envelope
    if (!body.message || !body.message.data) {
      return NextResponse.json({ error: 'Invalid Pub/Sub message envelope' }, { status: 400 });
    }

    const decodedStr = Buffer.from(body.message.data, 'base64').toString('utf8');
    const notification = JSON.parse(decodedStr);

    const emailAddress = notification.emailAddress;
    const historyId = notification.historyId;

    console.log(`[Pub/Sub Webhook] Received notification for ${emailAddress}, historyId: ${historyId}`);

    // Lookup user by email and trigger incremental history sync
    if (emailAddress) {
      const user = await db.user.findUnique({ where: { email: emailAddress } });
      if (user) {
        await syncGmailHistory(user.id, String(historyId));
      }
    }

    // Broadcast SSE update to active clients
    broadcastSyncEvent({
      type: 'INBOX_UPDATED',
      emailAddress,
      historyId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, historyId });
  } catch (error: any) {
    console.error('Pub/Sub Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

