import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getFriendWishlist } from '@/lib/queries/wishlists';
import { FriendWishlistClient } from './friend-wishlist-client';
import { TopNav } from '@/components/top-nav';
import { getAllNotifications } from '@/lib/actions/notifications';
import styles from './page.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FriendWishlistPage({ params }: Props) {
  const { id: personId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [notificationRows, wishlistData] = await Promise.all([
    getAllNotifications(userId),
    getFriendWishlist(personId, userId),
  ]);

  if (!wishlistData.access) {
    const name = wishlistData.person?.name ?? 'This person';
    return (
      <>
        <TopNav notifications={notificationRows} />
        <main className={styles.page}>
          <Link href={`/friends/${personId}`} className={styles.backLink}>
            ← Back to {name}
          </Link>
          <div className={styles.accessDenied}>
            <h1 className={styles.accessTitle}>Wishlist locked</h1>
            <p className={styles.accessText}>
              You need Inner Circle access to see {name}&apos;s wishlist.
              Update their tier in your contacts to Inner Circle.
            </p>
            <Link href={`/friends/${personId}`} className={styles.ctaLink}>
              Go back and update tier
            </Link>
          </div>
        </main>
      </>
    );
  }

  const person = wishlistData.person!;
  const items = wishlistData.items ?? [];

  return (
    <>
      <TopNav notifications={notificationRows} />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{person.name}&apos;s Wishlist</h1>
            <p className={styles.pageSubtitle}>
              {items.length === 0
                ? 'Nothing added yet'
                : `${items.length} item${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link href={`/friends/${personId}`} className={styles.backLink}>
            ← Back to {person.name}
          </Link>
        </div>

        <FriendWishlistClient
          items={items}
          friendName={person.name}
          friendId={personId}
        />
      </main>
    </>
  );
}
