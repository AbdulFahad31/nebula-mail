import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { trashEmailService, untrashEmailService } from '@/lib/gmail/messages';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const userId = session?.userId || 'demo_user_id';
  const { id } = await params;
  try {
    const ok = await trashEmailService(userId, id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const userId = session?.userId || 'demo_user_id';
  const { id } = await params;
  try {
    const ok = await untrashEmailService(userId, id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
