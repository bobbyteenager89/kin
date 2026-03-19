'use client';

import { useState, useTransition } from 'react';
import { updateUserProfile } from '@/lib/actions/settings';
import styles from './settings.module.css';

interface SettingsClientProps {
  user: {
    phone: string | null;
    city: string | null;
    bio: string | null;
    notificationPrefs: { birthdayDaysBefore: number; enabled: boolean } | null;
  };
  clerkName: string;
  clerkEmail: string;
}

export function SettingsClient({ user, clerkName, clerkEmail }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState(user.phone ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [notifEnabled, setNotifEnabled] = useState(
    user.notificationPrefs?.enabled ?? true
  );
  const [daysBefore, setDaysBefore] = useState(
    user.notificationPrefs?.birthdayDaysBefore ?? 1
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        await updateUserProfile({
          phone: phone.trim() || null,
          city: city.trim() || null,
          bio: bio.trim() || null,
          notificationPrefs: {
            enabled: notifEnabled,
            birthdayDaysBefore: daysBefore,
          },
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.settingsForm}>
      {/* Profile */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>

        <div className={styles.field}>
          <span className={styles.label}>Name</span>
          <div className={styles.readonlyField}>{clerkName || 'Not set'}</div>
          <span className={styles.fieldHint}>Managed by your account provider</span>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Email</span>
          <div className={styles.readonlyField}>{clerkEmail || 'Not set'}</div>
          <span className={styles.fieldHint}>Managed by your account provider</span>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Phone</span>
          <input
            className={styles.input}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555-555-5555"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>City</span>
          <input
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Austin, TX"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Bio</span>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A few words about you..."
            rows={3}
          />
        </label>
      </section>

      {/* Notifications */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Birthday Reminders</h2>

        <label className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Enable birthday reminders</span>
            <p className={styles.toggleDesc}>Get notified before friends&apos; birthdays</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifEnabled}
            className={`${styles.toggle} ${notifEnabled ? styles.toggleOn : ''}`}
            onClick={() => setNotifEnabled(!notifEnabled)}
          >
            <span className={styles.toggleThumb} />
          </button>
        </label>

        {notifEnabled && (
          <label className={styles.field}>
            <span className={styles.label}>Remind me how many days before?</span>
            <select
              className={styles.input}
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
            >
              <option value={1}>1 day before</option>
              <option value={3}>3 days before</option>
              <option value={7}>1 week before</option>
              <option value={14}>2 weeks before</option>
            </select>
          </label>
        )}
      </section>

      {/* Connected Accounts */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Connected Accounts</h2>
        <div className={styles.connectedAccount}>
          <div className={styles.accountIcon}>G</div>
          <div>
            <p className={styles.accountName}>Google</p>
            <p className={styles.accountEmail}>{clerkEmail}</p>
          </div>
          <span className={styles.connectedBadge}>Connected</span>
        </div>
      </section>

      {/* Danger Zone */}
      <section className={`${styles.section} ${styles.dangerZone}`}>
        <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger Zone</h2>
        <p className={styles.dangerText}>
          Deleting your account removes all your data permanently.
          This cannot be undone.
        </p>
        <button type="button" className={styles.deleteBtn} disabled>
          Delete Account
        </button>
        <p className={styles.dangerHint}>Contact support to request account deletion.</p>
      </section>

      {/* Actions */}
      <div className={styles.formActions}>
        {error && <p className={styles.error}>{error}</p>}
        {saved && <p className={styles.savedMsg}>Settings saved!</p>}
        <button type="submit" className={styles.saveBtn} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
