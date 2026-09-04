import { NextRequest, NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, isConnected: false });
  }

  const oauthAccount = await db.oAuthAccount.findUnique({
    where: { userId: session.userId },
  });

  return NextResponse.json({
    authenticated: true,
    isConnected: !!oauthAccount,
    email: session.email,
    user: session,
  });
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (session?.userId) {
      // Clear OAuthAccount record from Prisma DB to revoke/clear stored encrypted refresh tokens
      await db.oAuthAccount.deleteMany({
        where: { userId: session.userId },
      });
      
      // Also clear cached emails and threads for this user if desired
      await db.emailCache.deleteMany({
        where: { userId: session.userId },
      });
      await db.thread.deleteMany({
        where: { userId: session.userId },
      });
    }

    // Clear session cookie
    await clearSession();

    return NextResponse.json({ success: true, message: 'Account disconnected and session cleared' });
  } catch (error: any) {
    console.error('DELETE /api/gmail/account error:', error);
    await clearSession();
    return NextResponse.json({ success: true });
  }
}
