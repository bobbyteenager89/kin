'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { notifications, persons } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ── Public helpers (called internally, not via client) ───────────────────────

/**
 * Creates an "added_to_circle" notification for the person being added.
 * Also stores a unique token so the person can see who added them if they sign up.
 * SMS delivery via Twilio will be added later.
 */
export async function createAddedNotification(personId: string, ownerUserId: string) {
  const token = nanoid(16);

  // Store the notification against the owner (so they can see it in their history)
  await db.insert(notifications).values({
    userId: ownerUserId,
    type: 'added_to_circle',
    data: {
      personId,
      token,
      // smsDelivered: false  — will add when Twilio lands
    },
    read: true, // Owner doesn't need to see their own "you added someone" notification
  });

  return { token };
}

// ── Authenticated actions ────────────────────────────────────────────────────

export async function getUnreadNotifications(userId: string) {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return rows;
}

export async function getAllNotifications(userId: string) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return rows;
}

export async function markNotificationRead(notificationId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}
