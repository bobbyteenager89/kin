import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons, children, events } from '@/lib/db/schema';
import { personSchema } from '@/lib/validators/person';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function syncPersonEvents(
  userId: string,
  personId: string,
  input: ReturnType<typeof personSchema.parse>
) {
  await db.delete(events).where(eq(events.personId, personId));

  const toInsert: (typeof events.$inferInsert)[] = [];

  if (input.birthday) {
    toInsert.push({
      userId,
      personId,
      type: 'birthday',
      title: `${input.name}'s Birthday`,
      date: input.birthday,
      recurring: true,
      source: 'manual',
    });
  }

  if (input.weddingAnniversary && input.partnerName) {
    toInsert.push({
      userId,
      personId,
      type: 'anniversary',
      title: `${input.name} & ${input.partnerName} Anniversary`,
      date: input.weddingAnniversary,
      recurring: true,
      source: 'manual',
    });
  }

  for (const child of input.children ?? []) {
    if (child.birthday) {
      toInsert.push({
        userId,
        personId,
        type: 'kids_birthday',
        title: `${child.name}'s Birthday`,
        date: child.birthday,
        recurring: true,
        source: 'manual',
      });
    }
  }

  if (toInsert.length > 0) {
    await db.insert(events).values(toInsert);
  }
}

// ── GET /api/mobile/persons/[id] ─────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const { id } = await params;

  const rows = await db.select().from(persons).where(eq(persons.id, id));
  const person = rows[0];

  if (!person || person.ownerUserId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const personChildren = await db
    .select()
    .from(children)
    .where(eq(children.personId, id));

  return NextResponse.json({ ...person, children: personChildren });
}

// ── PATCH /api/mobile/persons/[id] ───────────────────────────────────────────

export async function PATCH(
  req: Request,
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = personSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const input = parsed.data;

  const [updated] = await db
    .update(persons)
    .set({
      name: input.name,
      nickname: input.nickname ?? null,
      relation: input.relation ?? null,
      birthday: input.birthday ?? null,
      partnerName: input.partnerName ?? null,
      weddingAnniversary: input.weddingAnniversary ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email || null,
      tags: input.tags ?? [],
      notes: input.notes ?? null,
      tier: input.tier,
      updatedAt: new Date(),
    })
    .where(eq(persons.id, id))
    .returning();

  await db.delete(children).where(eq(children.personId, id));

  if (input.children && input.children.length > 0) {
    await db.insert(children).values(
      input.children.map((c) => ({
        personId: id,
        name: c.name,
        birthday: c.birthday ?? null,
      }))
    );
  }

  await syncPersonEvents(userId, id, input);

  return NextResponse.json(updated);
}

// ── DELETE /api/mobile/persons/[id] ──────────────────────────────────────────

export async function DELETE(
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

  await db.delete(persons).where(eq(persons.id, id));

  return NextResponse.json({ success: true });
}
