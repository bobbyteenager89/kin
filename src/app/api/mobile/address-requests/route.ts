import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { addressRequests, persons, notifications } from '@/lib/db/schema';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';
import { nanoid } from 'nanoid';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

const createAddressRequestSchema = z.object({
  personId: z.string().uuid(),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createAddressRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const { personId, message } = parsed.data;

  const personRows = await db
    .select({ id: persons.id, name: persons.name, ownerUserId: persons.ownerUserId })
    .from(persons)
    .where(eq(persons.id, personId));

  const person = personRows[0];
  if (!person || person.ownerUserId !== userId) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }

  const token = nanoid(12);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [request] = await db
    .insert(addressRequests)
    .values({
      senderId: userId,
      recipientPersonId: personId,
      token,
      message: message?.trim() || null,
      status: 'pending',
      expiresAt,
    })
    .returning();

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

  const tokenUrl = `${getBaseUrl()}/a/${token}`;
  return NextResponse.json({ ...request, tokenUrl }, { status: 201 });
}
