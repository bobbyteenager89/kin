import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  const rows = await db.select().from(persons).where(eq(persons.id, id));
  const existing = rows[0];

  if (!existing || existing.ownerUserId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [updated] = await db
    .update(persons)
    .set({ lastCaughtUp: new Date(), updatedAt: new Date() })
    .where(eq(persons.id, id))
    .returning();

  return NextResponse.json(updated);
}
