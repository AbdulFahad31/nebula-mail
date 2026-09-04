import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { encryptToken } from '@/lib/auth/crypto';
import { createSession } from '@/lib/auth/session';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const demoEmail = 'demo.user@nebulamail.app';

  try {
    const user = await db.user.upsert({
      where: { email: demoEmail },
      update: { name: 'Demo Explorer', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      create: {
        email: demoEmail,
        name: 'Demo Explorer',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    await db.oAuthAccount.upsert({
      where: { userId: user.id },
      update: {
        accessTokenEncrypted: encryptToken('demo-access-token'),
        refreshTokenEncrypted: encryptToken('demo-refresh-token'),
        expiresAt,
        scope: 'demo-scope',
      },
      create: {
        userId: user.id,
        accessTokenEncrypted: encryptToken('demo-access-token'),
        refreshTokenEncrypted: encryptToken('demo-refresh-token'),
        expiresAt,
        scope: 'demo-scope',
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name || 'Demo Explorer',
      avatarUrl: user.avatarUrl || undefined,
    });

    return NextResponse.redirect(`${appUrl}/inbox`);
  } catch (error) {
    console.error('Demo auth error:', error);
    return NextResponse.redirect(`${appUrl}?error=demo_failed`);
  }
}
