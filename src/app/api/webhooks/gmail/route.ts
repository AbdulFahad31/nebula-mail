import { NextRequest, NextResponse } from 'next/server';
import { syncUserMessagesToCache } from '@/lib/gmail/messages';
import { broadcastSyncEvent } from '../sse-emitter';

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
