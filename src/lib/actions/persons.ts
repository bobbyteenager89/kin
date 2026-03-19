'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { persons, children, events, users } from '../db/schema';
import { personSchema, type PersonInput } from '../validators/person';
import { createAddedNotification } from './notifications';

// ── Helpers ─────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

/**
 * Auto-creates birthday and anniversary events when a person is saved.
 * Replaces any existing auto-generated events for this person.
 */
async function syncPersonEvents(
  userId: string,
  personId: string,
  input: PersonInput
) {
  // Remove old auto-created events for this person
  await db
    .delete(events)
    .where(eq(events.personId, personId));

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

  // Kids' birthdays
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

// ── Actions ──────────────────────────────────────────────────────────────────

export async function createPerson(raw: unknown) {
  const userId = await requireUserId();
  const input = personSchema.parse(raw);

  // Ensure user row exists (Clerk webhook may not have fired yet)
  await db
    .insert(users)
    .values({ id: userId })
    .onConflictDoNothing();

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

  // Insert children
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

  // If the person has a phone number, create an "added to circle" notification
  // (SMS delivery via Twilio will be wired up later)
  if (input.phone) {
    await createAddedNotification(person.id, userId);
  }

  return person;
}

export async function updatePerson(personId: string, raw: unknown) {
  const userId = await requireUserId();
  const input = personSchema.parse(raw);

  // Verify ownership
  const existing = await db
    .select()
    .from(persons)
    .where(eq(persons.id, personId));

  if (!existing[0] || existing[0].ownerUserId !== userId) {
    throw new Error('Not found');
  }

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
    .where(eq(persons.id, personId))
    .returning();

  // Replace children: delete existing, re-insert
  await db.delete(children).where(eq(children.personId, personId));

  if (input.children && input.children.length > 0) {
    await db.insert(children).values(
      input.children.map((c) => ({
        personId,
        name: c.name,
        birthday: c.birthday ?? null,
      }))
    );
  }

  await syncPersonEvents(userId, personId, input);

  return updated;
}

export async function deletePerson(personId: string) {
  const userId = await requireUserId();

  const existing = await db
    .select()
    .from(persons)
    .where(eq(persons.id, personId));

  if (!existing[0] || existing[0].ownerUserId !== userId) {
    throw new Error('Not found');
  }

  await db.delete(persons).where(eq(persons.id, personId));
}

export async function markCaughtUp(personId: string) {
  const userId = await requireUserId();

  const existing = await db
    .select()
    .from(persons)
    .where(eq(persons.id, personId));

  if (!existing[0] || existing[0].ownerUserId !== userId) {
    throw new Error('Not found');
  }

  const [updated] = await db
    .update(persons)
    .set({ lastCaughtUp: new Date(), updatedAt: new Date() })
    .where(eq(persons.id, personId))
    .returning();

  return updated;
}
