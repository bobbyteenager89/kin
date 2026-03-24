import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { pushTokens, users } from '@/lib/db/schema';
import { getAuthUserId, unauthorized } from '@/lib/api/auth';

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios']).default('ios'),
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const { token, platform } = parsed.data;

  // Ensure user row exists
  await db.insert(users).values({ id: userId }).onConflictDoNothing();

  const [row] = await db
    .insert(pushTokens)
    .values({ userId, token, platform })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
