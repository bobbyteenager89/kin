import { NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';

export async function GET(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('phoneNumbers');

  if (!raw) {
    return NextResponse.json({ error: 'phoneNumbers query param required' }, { status: 400 });
  }

  const phoneNumbers = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (phoneNumbers.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const rows = await db
    .select({ phone: users.phone })
    .from(users)
    .where(inArray(users.phone, phoneNumbers));

  const matches = rows.map((r) => r.phone).filter(Boolean) as string[];

  return NextResponse.json({ matches });
}
