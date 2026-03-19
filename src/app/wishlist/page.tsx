import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getOrCreateWishlist, getWishlistForUser } from '@/lib/actions/wishlists';
import { WishlistClient } from './wishlist-client';
import { TopNav } from '@/components/top-nav';
import { getAllNotifications } from '@/lib/actions/notifications';
import styles from './page.module.css';

export default async function WishlistPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [notificationRows, wishlistData] = await Promise.all([
    getAllNotifications(userId),
    getWishlistForUser(userId, userId),
  ]);

  const { wishlist, items } = wishlistData;

  // Ensure wishlist exists
  const resolvedWishlist = wishlist ?? await getOrCreateWishlist(userId);

  return (
    <>
      <TopNav notifications={notificationRows} />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Wishlist</h1>
            <p className={styles.pageSubtitle}>
              Tell your inner circle what you actually want
            </p>
          </div>
          <Link href="/" className={styles.backLink}>← Dashboard</Link>
        </div>

        <WishlistClient
          wishlistId={resolvedWishlist.id}
          initialItems={items}
        />
      </main>
    </>
  );
}
