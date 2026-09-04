import { NextRequest } from 'next/server';
import { addSyncListener, removeSyncListener } from '../../webhooks/sse-emitter';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      addSyncListener(listener);

      // Send initial connection heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`));

      req.signal.addEventListener('abort', () => {
        removeSyncListener(listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
