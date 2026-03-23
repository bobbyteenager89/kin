'use client';

import Link from 'next/link';
import styles from './friend-card.module.css';

export type Tier = 'everyone' | 'friends' | 'inner_circle';

interface DetailItem {
  label: string;
  value: string;
  accent?: boolean;
}

export interface FriendCardData {
  id: string;
  name: string;
  relation: string | null;
  avatarUrl: string | null;
  tags?: string[];
  tier?: Tier;
  featured?: boolean;
  details?: DetailItem[];
  addressVerifiedAt?: Date | null;
}

function FreshnessIndicator({ verifiedAt }: { verifiedAt: Date | null | undefined }) {
  if (!verifiedAt) return <span className={styles.freshnessNone} title="Address not verified" />;
  const ageMs = Date.now() - verifiedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 180) return <span className={styles.freshnessGreen} title="Address up to date" />;
  if (ageDays < 365) return <span className={styles.freshnessYellow} title="Address may be outdated" />;
  return <span className={styles.freshnessRed} title="Address likely outdated" />;
}

export function FriendCard({ friend }: { friend: FriendCardData }) {
  const freshness = (
    <FreshnessIndicator verifiedAt={friend.addressVerifiedAt} />
  );

  const isFresh = friend.addressVerifiedAt
    ? (Date.now() - friend.addressVerifiedAt.getTime()) / (1000 * 60 * 60 * 24) < 180
    : false;

  return (
    <Link href={`/friends/${friend.id}`} className={styles.rosterRow}>
      <div
        className={styles.squareAvatar}
        style={friend.avatarUrl ? { backgroundImage: `url(${friend.avatarUrl})` } : undefined}
      >
        {!friend.avatarUrl && (
          <span className={styles.avatarInitial}>
            {friend.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className={styles.rowInfo}>
        <div className={styles.rowName}>{friend.name}</div>
        {friend.relation && (
          <div className={styles.rowMeta}>
            <span
              className={`${styles.freshnessDot} ${isFresh ? styles.dotTeal : styles.dotGrey}`}
            />
            {friend.relation}
          </div>
        )}
      </div>

      <div className={styles.rowTrailing}>
        {freshness}
      </div>
    </Link>
  );
}
