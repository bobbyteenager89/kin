import { and, eq, gte } from 'drizzle-orm';
import { db } from '../db';
import { events, persons } from '../db/schema';

export interface UpcomingEvent {
  id: string;
  type: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  personId: string | null;
  personName: string | null;
  daysUntil: number;
}

/**
 * Computes the next occurrence date for a recurring event (e.g. birthday, anniversary).
 * The stored date may use year 1904 as sentinel for "year unknown".
 */
function nextOccurrence(isoDate: string): Date {
  const [, monthStr, dayStr] = isoDate.split('-');
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const now = new Date();
  const thisYear = now.getFullYear();

  let candidate = new Date(thisYear, month, day);
  if (candidate < now) {
    candidate = new Date(thisYear + 1, month, day);
  }
  return candidate;
}

function daysUntil(target: Date): number {
  const now = new Date();
  const diffMs = target.getTime() - now.setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function getUpcomingEvents(
  userId: string,
  limit = 10
): Promise<UpcomingEvent[]> {
  const today = new Date().toISOString().split('T')[0];

  // Fetch all events for this user
  const rows = await db
    .select({
      id: events.id,
      type: events.type,
      title: events.title,
      date: events.date,
      recurring: events.recurring,
      personId: events.personId,
      personName: persons.name,
    })
    .from(events)
    .leftJoin(persons, eq(events.personId, persons.id))
    .where(eq(events.userId, userId));

  const upcoming: UpcomingEvent[] = [];

  for (const row of rows) {
    let targetDate: Date;

    if (row.recurring) {
      targetDate = nextOccurrence(row.date);
    } else {
      targetDate = new Date(row.date + 'T00:00:00');
      if (row.date < today) continue; // past non-recurring event, skip
    }

    upcoming.push({
      id: row.id,
      type: row.type,
      title: row.title,
      date: row.date,
      personId: row.personId ?? null,
      personName: row.personName ?? null,
      daysUntil: daysUntil(targetDate),
    });
  }

  // Sort by how soon they occur
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

  return upcoming.slice(0, limit);
}
