import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/auth/google-oauth';
import { google } from 'googleapis';
import { db } from '@/lib/db/prisma';
import { encryptToken } from '@/lib/auth/crypto';
import { createSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(`${appUrl}?error=missing_code`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch User Profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      return NextResponse.redirect(`${appUrl}?error=no_email`);
    }

    const email = userInfo.email;
    const name = userInfo.name || email.split('@')[0];
    const avatarUrl = userInfo.picture || undefined;

    // Upsert User in DB
    const user = await db.user.upsert({
      where: { email },
      update: { name, avatarUrl },
      create: { email, name, avatarUrl },
    });

    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    // Upsert OAuthAccount with encrypted tokens
    await db.oAuthAccount.upsert({
      where: { userId: user.id },
      update: {
        accessTokenEncrypted: encryptToken(tokens.access_token || ''),
        refreshTokenEncrypted: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,
        expiresAt,
        scope: tokens.scope || '',
      },
      create: {
        userId: user.id,
        accessTokenEncrypted: encryptToken(tokens.access_token || ''),
        refreshTokenEncrypted: encryptToken(tokens.refresh_token || ''),
        expiresAt,
        scope: tokens.scope || '',
      },
    });

    // Create Encrypted JWT Cookie
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      avatarUrl: user.avatarUrl || undefined,
    });

    return NextResponse.redirect(`${appUrl}/inbox`);
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    return NextResponse.redirect(`${appUrl}?error=oauth_failed`);
  }
}
