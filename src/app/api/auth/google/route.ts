import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/auth/google-oauth';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host = req.headers.get('host') || 'localhost:3001';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${host}`;
  const promptParam = req.nextUrl.searchParams.get('prompt') || 'consent';

  if (!clientId || clientId.includes('your-google-client-id')) {
    // If real credentials are missing, redirect to demo login callback for seamless testing
    return NextResponse.redirect(new URL('/api/auth/callback/demo', appUrl));
  }

  const url = getAuthUrl(promptParam);
  return NextResponse.redirect(url);
}
