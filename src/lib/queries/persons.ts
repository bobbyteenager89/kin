import { eq } from 'drizzle-orm';
import { db } from '../db';
import { persons, children } from '../db/schema';

export async function getPersonsByUser(userId: string) {
  const rows = await db
    .select()
    .from(persons)
    .where(eq(persons.ownerUserId, userId))
    .orderBy(persons.name);

  return rows;
}

export async function getPersonById(personId: string, userId: string) {
  const rows = await db
    .select()
    .from(persons)
    .where(eq(persons.id, personId));

  const person = rows[0];
  if (!person || person.ownerUserId !== userId) return null;

  const personChildren = await db
    .select()
    .from(children)
    .where(eq(children.personId, personId));

  return { ...person, children: personChildren };
}
