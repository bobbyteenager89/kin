import { NextResponse } from 'next/server';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';
import { getUpcomingEvents } from '@/lib/queries/events';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const upcoming = await getUpcomingEvents(userId, 30);

  return NextResponse.json(upcoming);
}
