import { db } from '@/lib/db';
import { persons, users, notifications } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const allUsers = await db.query.users.findMany();
  let remindersCreated = 0;

  for (const user of allUsers) {
    const prefs = user.notificationPrefs as { birthdayDaysBefore: number; enabled: boolean } | null;
    if (!prefs?.enabled) continue;
    const daysBefore = prefs.birthdayDaysBefore ?? 1;

    const userPersons = await db.query.persons.findMany({
      where: eq(persons.ownerUserId, user.id),
    });

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysBefore);
    const todayStr = now.toISOString().split('T')[0];
    const targetDateStr = targetDate.toISOString().split('T')[0];

    for (const person of userPersons) {
      if (!person.birthday) continue;
      const bday = new Date(person.birthday);
      // Check if month+day matches target date
      if (bday.getMonth() !== targetDate.getMonth() || bday.getDate() !== targetDate.getDate()) {
        continue;
      }

      // Avoid duplicates: skip if a birthday_reminder already exists for this person+date today
      const dupes = await db
        .select()
        .from(notifications)
        .where(
          sql`${notifications.userId} = ${user.id}
            AND ${notifications.type} = 'birthday_reminder'
            AND ${notifications.data}->>'personId' = ${person.id}
            AND ${notifications.data}->>'date' = ${targetDateStr}
            AND DATE(${notifications.createdAt}) = ${todayStr}::date`
        );

      if (dupes.length > 0) continue;

      await db.insert(notifications).values({
        userId: user.id,
        type: 'birthday_reminder',
        data: {
          personId: person.id,
          personName: person.name,
          date: targetDateStr,
        },
      });
      remindersCreated++;
    }
  }

  return Response.json({ remindersCreated });
}
