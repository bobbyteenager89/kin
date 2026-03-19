'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { addressRequests, persons, notifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function createAddressRequest(
  personId: string,
  message?: string,
  recipientPhone?: string,
  recipientEmail?: string
) {
  const userId = await requireUserId();

  // Verify the person belongs to this user
  const personRows = await db
    .select({ id: persons.id, name: persons.name, ownerUserId: persons.ownerUserId })
    .from(persons)
    .where(eq(persons.id, personId));

  const person = personRows[0];
  if (!person || person.ownerUserId !== userId) {
    throw new Error('Person not found');
  }

  const token = nanoid(12);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [request] = await db
    .insert(addressRequests)
    .values({
      senderId: userId,
      recipientPersonId: personId,
      token,
      message: message?.trim() || null,
      recipientPhone: recipientPhone?.trim() || null,
      recipientEmail: recipientEmail?.trim() || null,
      status: 'pending',
      expiresAt,
    })
    .returning();

  // Create a notification for the sender to track this request
  await db.insert(notifications).values({
    userId,
    type: 'address_request',
    data: {
      personId,
      personName: person.name,
      requestId: request.id,
      token,
    },
    read: false,
  });

  revalidatePath('/');

  const tokenUrl = `${getBaseUrl()}/a/${token}`;
  return { ...request, tokenUrl };
}

export async function completeAddressRequest(
  token: string,
  addressData: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    birthday?: string;
    phone?: string;
  }
) {
  const requestRows = await db
    .select()
    .from(addressRequests)
    .where(eq(addressRequests.token, token));

  const request = requestRows[0];

  if (!request) {
    return { success: false, error: 'Request not found' };
  }

  if (request.status === 'completed') {
    return { success: false, error: 'already_completed' };
  }

  if (request.status === 'expired' || request.expiresAt < new Date()) {
    // Mark as expired if it isn't already
    if (request.status !== 'expired') {
      await db
        .update(addressRequests)
        .set({ status: 'expired' })
        .where(eq(addressRequests.id, request.id));
    }
    return { success: false, error: 'expired' };
  }

  // Update the person's address
  const addressUpdate: Record<string, unknown> = {
    address: {
      street: addressData.street?.trim() || undefined,
      city: addressData.city?.trim() || undefined,
      state: addressData.state?.trim() || undefined,
      zip: addressData.zip?.trim() || undefined,
    },
    addressVerifiedAt: new Date(),
    updatedAt: new Date(),
  };

  if (addressData.birthday?.trim()) {
    addressUpdate.birthday = addressData.birthday.trim();
  }

  if (addressData.phone?.trim()) {
    addressUpdate.phone = addressData.phone.trim();
  }

  await db
    .update(persons)
    .set(addressUpdate)
    .where(eq(persons.id, request.recipientPersonId));

  // Mark request as completed
  await db
    .update(addressRequests)
    .set({ status: 'completed', respondedAt: new Date() })
    .where(eq(addressRequests.id, request.id));

  // Notify the sender that address was received
  await db.insert(notifications).values({
    userId: request.senderId,
    type: 'address_request',
    data: {
      completed: true,
      personId: request.recipientPersonId,
      requestId: request.id,
    },
    read: false,
  });

  return { success: true };
}

export async function getAddressRequestByToken(token: string) {
  const requestRows = await db
    .select()
    .from(addressRequests)
    .where(eq(addressRequests.token, token));

  const request = requestRows[0];
  if (!request) return null;

  // Get sender's display name from Clerk
  let senderName = 'Someone';
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(request.senderId);
    senderName = user.firstName
      ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
      : (user.username ?? 'Someone');
  } catch {
    // Swallow — sender name is cosmetic
  }

  return {
    ...request,
    senderName,
  };
}
