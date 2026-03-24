import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons, children, users } from '@/lib/db/schema';
import { personSchema } from '@/lib/validators/person';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';
import { createAddedNotification } from '@/lib/actions/notifications';
import { events } from '@/lib/db/schema';

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

// ── GET /api/mobile/persons ───────────────────────────────────────────────────

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const personRows = await db
    .select()
    .from(persons)
    .where(eq(persons.ownerUserId, userId))
    .orderBy(persons.name);

  // Fetch children for all persons in one query
  const personIds = personRows.map((p) => p.id);
  let childRows: (typeof children.$inferSelect)[] = [];

  if (personIds.length > 0) {
    // Fetch all children then filter in JS (simpler than SQL IN with drizzle)
    const allChildren = await db.select().from(children);
    childRows = allChildren.filter((c) => personIds.includes(c.personId));
  }

  const childrenByPersonId = childRows.reduce<
    Record<string, (typeof children.$inferSelect)[]>
  >((acc, child) => {
    if (!acc[child.personId]) acc[child.personId] = [];
    acc[child.personId].push(child);
    return acc;
  }, {});

  const result = personRows.map((p) => ({
    ...p,
    children: childrenByPersonId[p.id] ?? [],
  }));

  return NextResponse.json(result);
}

// ── POST /api/mobile/persons ──────────────────────────────────────────────────

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

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

  // Ensure user row exists
  await db.insert(users).values({ id: userId }).onConflictDoNothing();

  const [person] = await db
    .insert(persons)
    .values({
      ownerUserId: userId,
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
    })
    .returning();

  if (input.children && input.children.length > 0) {
    await db.insert(children).values(
      input.children.map((c) => ({
        personId: person.id,
        name: c.name,
        birthday: c.birthday ?? null,
      }))
    );
  }

  await syncPersonEvents(userId, person.id, input);

  if (input.phone) {
    await createAddedNotification(person.id, userId);
  }

  return NextResponse.json(person, { status: 201 });
}
