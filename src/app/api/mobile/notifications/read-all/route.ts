import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  return NextResponse.json({ success: true });
}
