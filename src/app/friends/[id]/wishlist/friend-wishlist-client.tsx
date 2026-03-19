'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markItemPurchased, unmarkItemPurchased } from '@/lib/actions/wishlists';
import styles from './friend-wishlist.module.css';

interface WishlistItem {
  id: string;
  title: string;
  url: string | null;
  notes: string | null;
  priority: number;
  purchases: { purchasedByUserId: string }[];
  purchasedByViewer: boolean;
}

interface FriendWishlistClientProps {
  items: WishlistItem[];
  friendName: string;
  friendId: string;
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
};

export function FriendWishlistClient({ items, friendName, friendId }: FriendWishlistClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  function handleTogglePurchased(item: WishlistItem) {
    setError(null);
    setPendingItemId(item.id);

    startTransition(async () => {
      try {
        if (item.purchasedByViewer) {
          await unmarkItemPurchased(item.id);
        } else {
          await markItemPurchased(item.id);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setPendingItemId(null);
      }
    });
  }

  const sortedItems = [...items].sort((a, b) => a.priority - b.priority);

  if (sortedItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>{friendName} hasn&apos;t added anything yet</p>
        <p className={styles.emptySubtext}>Check back later — they might add items soon.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.hint}>
        Mark items as purchased so others in {friendName}&apos;s circle know not to duplicate gifts.
        {friendName} won&apos;t see this.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.itemsList}>
        {sortedItems.map((item) => {
          const totalPurchased = item.purchases.length;
          const isPurchasedByViewer = item.purchasedByViewer;
          const isThisItemPending = pendingItemId === item.id && isPending;

          return (
            <div
              key={item.id}
              className={`${styles.itemCard} ${totalPurchased > 0 ? styles.itemPurchased : ''}`}
            >
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <span className={`${styles.priorityBadge} ${styles[`priority${item.priority}`]}`}>
                    {PRIORITY_LABELS[item.priority]}
                  </span>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  {totalPurchased > 0 && (
                    <span className={styles.purchasedBadge}>
                      ✓ {totalPurchased === 1 ? 'Someone got this' : `${totalPurchased} people got this`}
                    </span>
                  )}
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.itemLink}
                  >
                    View item →
                  </a>
                )}
                {item.notes && <p className={styles.itemNotes}>{item.notes}</p>}
              </div>

              <button
                className={`${styles.markBtn} ${isPurchasedByViewer ? styles.markBtnActive : ''}`}
                onClick={() => handleTogglePurchased(item)}
                disabled={isThisItemPending}
                title={isPurchasedByViewer ? "Unmark as purchased" : "Mark as purchased"}
              >
                {isThisItemPending
                  ? '...'
                  : isPurchasedByViewer
                  ? '✓ I got this'
                  : "I'll get this"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
