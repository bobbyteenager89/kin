'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

interface UserProfileData {
  phone?: string | null;
  city?: string | null;
  bio?: string | null;
  notificationPrefs?: {
    birthdayDaysBefore: number;
    enabled: boolean;
  };
}

export async function updateUserProfile(data: UserProfileData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Upsert: ensure user row exists, then update
  await db
    .insert(users)
    .values({ id: userId })
    .onConflictDoNothing();

  const [updated] = await db
    .update(users)
    .set({
      phone: data.phone ?? null,
      city: data.city ?? null,
      bio: data.bio ?? null,
      ...(data.notificationPrefs ? { notificationPrefs: data.notificationPrefs } : {}),
    })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}

export async function getUserProfile(userId: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  return rows[0] ?? null;
}
