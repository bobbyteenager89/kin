import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getPersonById } from '@/lib/queries/persons';
import { FriendDetailClient } from './friend-detail-client';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Year 1904 = sentinel for "year unknown"
  if (year === 1904) return `${months[month - 1]} ${day}`;
  return `${months[month - 1]} ${day}, ${year}`;
}

function formatDateTime(dt: Date | null | undefined): string {
  if (!dt) return 'Never';
  return new Date(dt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function getFreshnessClass(verifiedAt: Date | null | undefined): string {
  if (!verifiedAt) return styles.freshnessNone;
  const ageDays = (Date.now() - new Date(verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 180) return styles.freshnessGreen;
  if (ageDays < 365) return styles.freshnessYellow;
  return styles.freshnessRed;
}

function getFreshnessLabel(verifiedAt: Date | null | undefined): string {
  if (!verifiedAt) return 'Not verified';
  const ageDays = (Date.now() - new Date(verifiedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 180) return 'Verified recently';
  if (ageDays < 365) return 'May be outdated';
  return 'Likely outdated';
}

export default async function FriendDetailPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;
  const person = await getPersonById(id, userId);
  if (!person) notFound();

  const tierClass = styles[`tier_${person.tier}`] ?? styles.tier_everyone;
  const tierLabel =
    person.tier === 'inner_circle' ? 'Inner Circle'
    : person.tier === 'friends' ? 'Friends'
    : 'Everyone';

  const hasAddress = !!(person.address?.street || person.address?.city);

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        ← Back to dashboard
      </Link>

      {/* Hero */}
      <div className={styles.hero}>
        <div
          className={styles.avatar}
          style={person.avatarUrl ? { backgroundImage: `url(${person.avatarUrl})` } : undefined}
          aria-label={`${person.name}'s avatar`}
        />
        <div className={styles.heroInfo}>
          <div className={styles.heroBadges}>
            <span className={`${styles.tierBadge} ${tierClass}`}>{tierLabel}</span>
            <span
              className={getFreshnessClass(person.addressVerifiedAt)}
              title={getFreshnessLabel(person.addressVerifiedAt)}
            />
          </div>
          <h1 className={styles.heroName}>{person.name}</h1>
          {person.nickname && (
            <p className={styles.heroNickname}>&ldquo;{person.nickname}&rdquo;</p>
          )}
          {person.relation && (
            <p className={styles.heroRelation}>{person.relation}</p>
          )}
        </div>
        <div className={styles.heroActions}>
          <FriendDetailClient person={person} />
        </div>
      </div>

      {/* Main grid */}
      <div className={styles.grid}>

        {/* Address */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Address</h2>
          </div>
          <div className={styles.addressBlock}>
            {hasAddress ? (
              <>
                <p className={styles.addressText}>
                  {person.address?.street && <>{person.address.street}<br /></>}
                  {person.address?.city}{person.address?.state ? `, ${person.address.state}` : ''}
                  {person.address?.zip ? ` ${person.address.zip}` : ''}
                </p>
                <div className={styles.addressMeta}>
                  <span className={getFreshnessClass(person.addressVerifiedAt)} />
                  <span className={styles.addressFreshness}>
                    {getFreshnessLabel(person.addressVerifiedAt)}
                    {person.addressVerifiedAt && ` · ${formatDateTime(person.addressVerifiedAt)}`}
                  </span>
                </div>
              </>
            ) : (
              <p className={styles.noAddress}>No address on file</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Details</h2>
          </div>
          {person.birthday && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Birthday</span>
              <span className={styles.detailValueAccent}>{formatDate(person.birthday)}</span>
            </div>
          )}
          {person.phone && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Phone</span>
              <span className={styles.detailValue}>{person.phone}</span>
            </div>
          )}
          {person.email && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <span className={styles.detailValue}>{person.email}</span>
            </div>
          )}
          {person.partnerName && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Partner</span>
              <span className={styles.detailValue}>{person.partnerName}</span>
            </div>
          )}
          {person.weddingAnniversary && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Anniversary</span>
              <span className={styles.detailValueAccent}>{formatDate(person.weddingAnniversary)}</span>
            </div>
          )}
          {!person.birthday && !person.phone && !person.email && !person.partnerName && (
            <p className={styles.empty}>No details added yet</p>
          )}
        </div>

        {/* Tags */}
        {(person.tags ?? []).length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Tags</h2>
            </div>
            <div className={styles.tagsRow}>
              {(person.tags ?? []).map((tag, i) => (
                <span
                  key={i}
                  style={{
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.3px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Children */}
        {person.children && person.children.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Children</h2>
            </div>
            {person.children.map((child) => (
              <div key={child.id} className={styles.childRow}>
                <span className={styles.childName}>{child.name}</span>
                {child.birthday && (
                  <span className={styles.childBirthday}>{formatDate(child.birthday)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {person.notes && (
          <div className={`${styles.section} ${styles.gridFull}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Notes</h2>
            </div>
            <p className={styles.notesText}>{person.notes}</p>
          </div>
        )}

        {/* Last Caught Up */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Last caught up</h2>
          </div>
          <div className={styles.caughtUpRow}>
            <span className={styles.caughtUpValue}>
              {person.lastCaughtUp ? formatDateTime(person.lastCaughtUp) : 'Never logged'}
            </span>
            <FriendDetailClient.MarkCaughtUp personId={person.id} />
          </div>
        </div>

      </div>
    </div>
  );
}
