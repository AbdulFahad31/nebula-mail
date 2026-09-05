import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getEmailsFromCache } from '@/lib/gmail/messages';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session?.userId || 'demo_user_id';

  const { searchParams } = new URL(req.url);
  const view = (searchParams.get('view') || 'inbox') as 'inbox' | 'sent' | 'trash';
  const keyword = searchParams.get('keyword') || undefined;
  const sender = searchParams.get('sender') || undefined;
  const subject = searchParams.get('subject') || undefined;
  const isUnreadParam = searchParams.get('isUnread');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const isUnread = isUnreadParam === 'true' ? true : isUnreadParam === 'false' ? false : undefined;

  try {
    const emails = await getEmailsFromCache(userId, {
      view,
      isSent: view === 'sent',
      isTrash: view === 'trash',
      keyword,
      sender,
      subject,
      isUnread,
      startDate,
      endDate,
    });

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error('API Mail List error:', error);
    return NextResponse.json({ emails: [], error: error.message }, { status: 500 });
  }
}
