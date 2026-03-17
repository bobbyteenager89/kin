import { Tag } from './Tag';
import styles from './FriendCard.module.css';

interface DetailItem {
  label: string;
  value: string;
  accent?: boolean;
}

export interface FriendCardData {
  name: string;
  relation: string;
  avatarUrl: string;
  tags?: string[];
  featured?: boolean;
  details?: DetailItem[];
}

function FeaturedCard({ friend }: { friend: FriendCardData }) {
  return (
    <div className={`${styles.friendCard} ${styles.featured}`}>
      <div
        className={`${styles.avatar} ${styles.avatarFeatured}`}
        style={{ backgroundImage: `url(${friend.avatarUrl})` }}
      />
      <div>
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
    </div>
  );
}

function StandardCard({ friend }: { friend: FriendCardData }) {
  return (
    <div className={styles.friendCard}>
      <div className={styles.cardHeader}>
        <div
          className={styles.avatar}
          style={{ backgroundImage: `url(${friend.avatarUrl})` }}
        />
        <div>
          <h3 className={styles.friendName}>{friend.name}</h3>
          <div className={styles.friendRelation}>{friend.relation}</div>
        </div>
      </div>
      {friend.tags && friend.tags.length > 0 && (
        <div className={styles.metaTags}>
          {friend.tags.map((tag, i) => (
            <Tag key={i} label={tag} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FriendCard({ friend }: { friend: FriendCardData }) {
  if (friend.featured) {
    return <FeaturedCard friend={friend} />;
  }
  return <StandardCard friend={friend} />;
}
