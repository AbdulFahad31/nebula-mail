import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { generateEmailBrief } from '@/lib/ai/email-brief';

// Simple in-memory rate limiting map: emailId -> lastTimestamp
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 3000; // 3 second cooldown per email ID

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId || 'demo_user_id';

    const body = await req.json().catch(() => ({}));
    const { emailId } = body;

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    // Rate limiting check
    const now = Date.now();
    const lastCalled = rateLimitMap.get(emailId) || 0;
    if (now - lastCalled < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        { error: 'Please wait 3 seconds before requesting another brief for this email.' },
        { status: 429 }
      );
    }
    rateLimitMap.set(emailId, now);

    // Fetch email server-side from database cache (do not trust client body content)
    const email = await db.emailCache.findFirst({
      where: {
        userId,
        OR: [{ id: emailId }, { gmailMessageId: emailId }],
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Never pass secrets or other users' data to Gemini
    const brief = await generateEmailBrief({
      subject: email.subject,
      sender: email.sender,
      recipient: email.recipient,
      bodyText: email.bodyText || '',
      bodyHtml: email.bodyHtml || '',
    });

    return NextResponse.json({ brief });
  } catch (error: any) {
    console.error('Email Brief API route error:', error?.message || error);
    const status = error?.status === 429 || error?.code === 429 ? 429 : 500;
    return NextResponse.json(
      { error: error?.message || 'Unable to generate the brief.' },
      { status }
    );
  }
}
