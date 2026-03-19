'use client';

import Link from 'next/link';
import { Tag } from './tag';
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

const TIER_LABELS: Record<Tier, string> = {
  everyone: 'Everyone',
  friends: 'Friends',
  inner_circle: 'Inner Circle',
};

function FreshnessIndicator({ verifiedAt }: { verifiedAt: Date | null | undefined }) {
  if (!verifiedAt) return <span className={styles.freshnessNone} title="Address not verified" />;
  const ageMs = Date.now() - verifiedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 180) return <span className={styles.freshnessGreen} title="Address up to date" />;
  if (ageDays < 365) return <span className={styles.freshnessYellow} title="Address may be outdated" />;
  return <span className={styles.freshnessRed} title="Address likely outdated" />;
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`${styles.tierBadge} ${styles[`tier_${tier}`]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}

function FeaturedCard({ friend }: { friend: FriendCardData }) {
  return (
    <Link href={`/friends/${friend.id}`} className={`${styles.friendCard} ${styles.featured}`}>
      <div
        className={`${styles.avatar} ${styles.avatarFeatured}`}
        style={friend.avatarUrl ? { backgroundImage: `url(${friend.avatarUrl})` } : undefined}
      />
      <div>
        <div className={styles.cardMeta}>
          {friend.tier && <TierBadge tier={friend.tier} />}
          <FreshnessIndicator verifiedAt={friend.addressVerifiedAt} />
        </div>
        <h3 className={`${styles.friendName} ${styles.friendNameFeatured}`}>{friend.name}</h3>
        <div className={`${styles.friendRelation} ${styles.friendRelationFeatured}`}>
          {friend.relation}
        </div>

        {friend.details && (
          <div className={styles.featuredDetails}>
            {friend.details.map((detail, i) => (
              <div key={i} className={styles.detailGroup}>
                <span className={styles.detailLabel}>{detail.label}</span>
                <span
                  className={styles.detailValue}
                  style={
                    detail.accent
                      ? { fontFamily: 'var(--font-accent)', fontSize: '1.3rem' }
                      : undefined
                  }
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function StandardCard({ friend }: { friend: FriendCardData }) {
  return (
    <Link href={`/friends/${friend.id}`} className={styles.friendCard}>
      <div className={styles.cardHeader}>
        <div
          className={styles.avatar}
          style={friend.avatarUrl ? { backgroundImage: `url(${friend.avatarUrl})` } : undefined}
        />
        <div className={styles.cardHeaderText}>
          <h3 className={styles.friendName}>{friend.name}</h3>
          <div className={styles.friendRelation}>{friend.relation}</div>
        </div>
        <FreshnessIndicator verifiedAt={friend.addressVerifiedAt} />
      </div>
      <div className={styles.cardFooter}>
        {friend.tier && <TierBadge tier={friend.tier} />}
        {friend.tags && friend.tags.length > 0 && (
          <div className={styles.metaTags}>
            {friend.tags.map((tag, i) => (
              <Tag key={i} label={tag} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function FriendCard({ friend }: { friend: FriendCardData }) {
  if (friend.featured) {
    return <FeaturedCard friend={friend} />;
  }
  return <StandardCard friend={friend} />;
}
