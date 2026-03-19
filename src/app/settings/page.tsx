import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '@/lib/actions/settings';
import { SettingsClient } from './settings-client';
import { TopNav } from '@/components/top-nav';
import { getAllNotifications } from '@/lib/actions/notifications';
import styles from './page.module.css';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [clerkUser, dbUser, notificationRows] = await Promise.all([
    currentUser(),
    getUserProfile(userId),
    getAllNotifications(userId),
  ]);

  const clerkName = clerkUser?.fullName ?? clerkUser?.firstName ?? '';
  const clerkEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? '';

  return (
    <>
      <TopNav notifications={notificationRows} />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>Manage your profile and preferences</p>
          </div>
          <Link href="/" className={styles.backLink}>← Dashboard</Link>
        </div>

        <SettingsClient
          user={{
            phone: dbUser?.phone ?? null,
            city: dbUser?.city ?? null,
            bio: dbUser?.bio ?? null,
            notificationPrefs: dbUser?.notificationPrefs ?? null,
          }}
          clerkName={clerkName}
          clerkEmail={clerkEmail}
        />
      </main>
    </>
  );
}
