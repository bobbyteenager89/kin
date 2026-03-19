import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { wishlists, wishlistItems, wishlistPurchases, persons } from '../db/schema';

/**
 * Get a user's wishlist with all their items (owner's view — no purchase info).
 */
export async function getWishlistWithItems(userId: string) {
  const wishlistRows = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId));

  if (!wishlistRows[0]) return { wishlist: null, items: [] };

  const items = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.wishlistId, wishlistRows[0].id))
    .orderBy(wishlistItems.priority, wishlistItems.createdAt);

  return { wishlist: wishlistRows[0], items };
}

/**
 * Get a friend's wishlist with purchase visibility for the viewer.
 * - personId is the UUID of the person record (from persons table)
 * - Requires inner_circle tier
 * - Returns null if access is denied.
 */
export async function getFriendWishlist(personId: string, viewerUserId: string) {
  // Check that the viewer owns this person record and has inner_circle tier
  const personRows = await db
    .select()
    .from(persons)
    .where(
      and(
        eq(persons.id, personId),
        eq(persons.ownerUserId, viewerUserId)
      )
    );

  const person = personRows[0];
  if (!person || person.tier !== 'inner_circle') {
    return { access: false as const, person: person ?? null };
  }

  // If the person hasn't claimed their account, they won't have a wishlist yet
  const friendUserId = person.claimedByUserId;
  if (!friendUserId) {
    return { access: true as const, person, wishlist: null, items: [] };
  }

  // Get the friend's wishlist
  const wishlistRows = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, friendUserId));

  if (!wishlistRows[0]) {
    return { access: true as const, person, wishlist: null, items: [] };
  }

  const items = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.wishlistId, wishlistRows[0].id))
    .orderBy(wishlistItems.priority, wishlistItems.createdAt);

  // Attach purchases — hidden from the friend (owner), visible to viewer
  const purchases = await db
    .select()
    .from(wishlistPurchases)
    .where(eq(wishlistPurchases.hiddenFromUserId, friendUserId));

  const purchaseMap = new Map<string, typeof purchases>();
  for (const p of purchases) {
    const arr = purchaseMap.get(p.wishlistItemId) ?? [];
    arr.push(p);
    purchaseMap.set(p.wishlistItemId, arr);
  }

  return {
    access: true as const,
    person,
    wishlist: wishlistRows[0],
    items: items.map((item) => ({
      ...item,
      purchases: purchaseMap.get(item.id) ?? [],
      purchasedByViewer: (purchaseMap.get(item.id) ?? []).some(
        (p) => p.purchasedByUserId === viewerUserId
      ),
    })),
  };
}
