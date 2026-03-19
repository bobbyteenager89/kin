'use server';

import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { wishlists, wishlistItems, wishlistPurchases } from '../db/schema';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

// ── Core ─────────────────────────────────────────────────────────────────────

export async function getOrCreateWishlist(userId: string) {
  const existing = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId));

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(wishlists)
    .values({ userId })
    .returning();

  return created;
}

// ── Item mutations ────────────────────────────────────────────────────────────

export async function addWishlistItem(
  wishlistId: string,
  data: { title: string; url?: string; notes?: string; priority?: number }
) {
  await requireUserId();

  const [item] = await db
    .insert(wishlistItems)
    .values({
      wishlistId,
      title: data.title.trim(),
      url: data.url?.trim() || null,
      notes: data.notes?.trim() || null,
      priority: data.priority ?? 2,
    })
    .returning();

  return item;
}

export async function removeWishlistItem(itemId: string) {
  const userId = await requireUserId();

  // Verify ownership via wishlist
  const rows = await db
    .select({ wishlistUserId: wishlists.userId })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
    .where(eq(wishlistItems.id, itemId));

  if (!rows[0] || rows[0].wishlistUserId !== userId) {
    throw new Error('Not found');
  }

  await db.delete(wishlistItems).where(eq(wishlistItems.id, itemId));
}

export async function updateWishlistItem(
  itemId: string,
  data: { title?: string; url?: string | null; notes?: string | null; priority?: number }
) {
  const userId = await requireUserId();

  const rows = await db
    .select({ wishlistUserId: wishlists.userId })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
    .where(eq(wishlistItems.id, itemId));

  if (!rows[0] || rows[0].wishlistUserId !== userId) {
    throw new Error('Not found');
  }

  const [updated] = await db
    .update(wishlistItems)
    .set({
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.url !== undefined ? { url: data.url?.trim() || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
    })
    .where(eq(wishlistItems.id, itemId))
    .returning();

  return updated;
}

// ── Purchase tracking ─────────────────────────────────────────────────────────

/**
 * Mark an item as purchased. The purchase is hidden from the wishlist owner.
 */
export async function markItemPurchased(itemId: string) {
  const userId = await requireUserId();

  // Get the wishlist owner to set hiddenFromUserId
  const rows = await db
    .select({ wishlistUserId: wishlists.userId })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
    .where(eq(wishlistItems.id, itemId));

  if (!rows[0]) throw new Error('Item not found');

  const wishlistOwnerId = rows[0].wishlistUserId;

  // Prevent owner from marking their own items purchased
  if (wishlistOwnerId === userId) {
    throw new Error('You cannot mark your own wishlist items as purchased');
  }

  // Check not already purchased by this user
  const existing = await db
    .select()
    .from(wishlistPurchases)
    .where(
      and(
        eq(wishlistPurchases.wishlistItemId, itemId),
        eq(wishlistPurchases.purchasedByUserId, userId)
      )
    );

  if (existing[0]) return existing[0];

  const [purchase] = await db
    .insert(wishlistPurchases)
    .values({
      wishlistItemId: itemId,
      purchasedByUserId: userId,
      hiddenFromUserId: wishlistOwnerId,
    })
    .returning();

  return purchase;
}

export async function unmarkItemPurchased(itemId: string) {
  const userId = await requireUserId();

  await db
    .delete(wishlistPurchases)
    .where(
      and(
        eq(wishlistPurchases.wishlistItemId, itemId),
        eq(wishlistPurchases.purchasedByUserId, userId)
      )
    );
}

// ── Query: view wishlist ──────────────────────────────────────────────────────

/**
 * Returns wishlist items for a given user.
 * - If viewerUserId === userId: exclude purchase info (owner can't see who bought)
 * - Otherwise: include purchase info so friends can coordinate
 */
export async function getWishlistForUser(userId: string, viewerUserId: string) {
  const wishlist = await getOrCreateWishlist(userId);

  const items = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.wishlistId, wishlist.id))
    .orderBy(wishlistItems.priority, wishlistItems.createdAt);

  const isOwner = viewerUserId === userId;

  if (isOwner) {
    return { wishlist, items: items.map((item) => ({ ...item, purchases: undefined })) };
  }

  // Attach purchase info for non-owners
  const purchases = await db
    .select()
    .from(wishlistPurchases)
    .where(eq(wishlistPurchases.hiddenFromUserId, userId));

  const purchaseMap = new Map<string, typeof purchases>();
  for (const p of purchases) {
    const arr = purchaseMap.get(p.wishlistItemId) ?? [];
    arr.push(p);
    purchaseMap.set(p.wishlistItemId, arr);
  }

  return {
    wishlist,
    items: items.map((item) => ({
      ...item,
      purchases: purchaseMap.get(item.id) ?? [],
      purchasedByViewer: (purchaseMap.get(item.id) ?? []).some(
        (p) => p.purchasedByUserId === viewerUserId
      ),
    })),
  };
}
