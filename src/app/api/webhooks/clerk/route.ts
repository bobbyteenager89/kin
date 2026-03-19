import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

interface ClerkUserCreatedEvent {
  type: 'user.created';
  data: {
    id: string;
    phone_numbers?: { phone_number: string }[];
  };
}

type ClerkEvent = ClerkUserCreatedEvent | { type: string; data: unknown };

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not set');
    return new Response('Server misconfigured', { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: ClerkEvent;

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkEvent;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'user.created') {
    const data = (event as ClerkUserCreatedEvent).data;
    const phone = data.phone_numbers?.[0]?.phone_number ?? null;

    await db
      .insert(users)
      .values({ id: data.id, phone })
      .onConflictDoNothing();
  }

  return new Response('OK', { status: 200 });
}
