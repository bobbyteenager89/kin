import { NextResponse } from 'next/server';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';
import { getAllNotifications } from '@/lib/actions/notifications';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const rows = await getAllNotifications(userId);
  return NextResponse.json(rows);
}
