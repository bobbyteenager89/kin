import Link from 'next/link';
import { APP_NAME } from '@/lib/config';
import styles from './page.module.css';

export const metadata = {
  title: `Someone added you to their circle — ${APP_NAME}`,
  description: `See who added you to their ${APP_NAME} circle`,
  openGraph: {
    title: '👀 Someone added you to their circle',
    description: 'Sign up to see who — it only takes a moment',
    type: 'website',
    images: ['/og-added.png'],
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AddedPage({ params }: PageProps) {
  // Token is stored for later — when user signs up we'll match them
  // For now this page just creates intrigue
  await params; // consume params (token stored in DB via notification)

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Decorative eye icon */}
        <span className={styles.eyeIcon} aria-hidden="true">👀</span>

        <h1 className={styles.heading}>
          Someone added you to their {APP_NAME} circle
        </h1>

        <p className={styles.subheading}>
          They think you&rsquo;re worth remembering.
        </p>

        <div className={styles.mysteryBox}>
          <span className={styles.mysteryLabel}>who is it?</span>
          <div className={styles.mysteryBlur}>
            <span className={styles.mysteryName}>?????</span>
          </div>
          <p className={styles.mysteryHint}>
            Sign up to see who added you — and add them back
          </p>
        </div>

        <Link href="/sign-up" className={styles.ctaBtn}>
          See who added you
        </Link>

        <p className={styles.footnote}>
          {APP_NAME} is a personal address book for people who like sending things.
          <br />
          No spam. No social feed. Just people you care about.
        </p>
      </div>
    </div>
  );
}
