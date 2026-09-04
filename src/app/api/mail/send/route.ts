import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { sendEmailService } from '@/lib/gmail/messages';
import { z } from 'zod';

const SendRequestSchema = z.object({
  to: z.array(z.string().email()),
  subject: z.string(),
  body: z.string(),
  threadId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.userId || 'demo_user_id';

  try {
    const json = await req.json();
    const validated = SendRequestSchema.parse(json);

    const email = await sendEmailService(userId, {
      to: validated.to,
      subject: validated.subject,
      body: validated.body,
      threadId: validated.threadId,
    });

    return NextResponse.json({ success: true, email });
  } catch (error: any) {
    console.error('Send API Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email payload', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Send failed' }, { status: 500 });
  }
}
