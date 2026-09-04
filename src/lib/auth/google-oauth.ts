import { google } from 'googleapis';
import { db } from '@/lib/db/prisma';
import { encryptToken, decryptToken } from './crypto';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

export async function getAuthenticatedGmailClient(userId: string) {
  const oauthAccount = await db.oAuthAccount.findUnique({
    where: { userId },
  });

  if (!oauthAccount) {
    throw new Error('AUTH_REQUIRED: No OAuth account linked to this user');
  }

  const client = getOAuth2Client();
  let accessToken = decryptToken(oauthAccount.accessTokenEncrypted);
  const refreshToken = decryptToken(oauthAccount.refreshTokenEncrypted);

  const now = new Date();
  const isExpired = oauthAccount.expiresAt.getTime() - now.getTime() < 5 * 60 * 1000; // 5 min buffer

  if (isExpired && refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();

    if (credentials.access_token) {
      accessToken = credentials.access_token;
      const newExpiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);

      await db.oAuthAccount.update({
        where: { userId },
        data: {
          accessTokenEncrypted: encryptToken(accessToken),
          expiresAt: newExpiresAt,
        },
      });
    }
  }

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: 'v1', auth: client });
}
