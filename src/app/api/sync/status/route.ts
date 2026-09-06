import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId || 'demo_user_id';

    const syncState = await db.syncState.findUnique({ where: { userId } });

    return NextResponse.json({
      lastSyncedAt: syncState?.lastSyncedAt?.toISOString() || null,
    });
  } catch (error: any) {
    return NextResponse.json({ lastSyncedAt: null, error: error.message }, { status: 500 });
  }
}
