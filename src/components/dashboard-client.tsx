'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from './top-nav';
import { Timeline, type TimelineEventData } from './timeline';
import { FriendCard, type FriendCardData } from './friend-card';
import { PersonDrawer } from './person-drawer';
import styles from './dashboard-client.module.css';

interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

interface DashboardClientProps {
  persons: FriendCardData[];
  events: TimelineEventData[];
  notifications?: Notification[];
}

export function DashboardClient({ persons, events, notifications = [] }: DashboardClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = search
    ? persons.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.relation ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : persons;

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  function handleSaved() {
    router.refresh();
  }

  return (
    <>
      <TopNav onSearch={setSearch} onAddPerson={() => setDrawerOpen(true)} notifications={notifications} />

      <main className={styles.dashboardGrid}>
        <Timeline events={events} />

        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Circle</h2>
            <span className={styles.sectionAccent}>fresh &amp; updated</span>
          </div>

          {persons.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Your circle is empty.</p>
              <p className={styles.emptySubtext}>Add your first friend to get started.</p>
              <button
                className={styles.emptyCtaBtn}
                onClick={() => setDrawerOpen(true)}
              >
                + Add Your First Friend
              </button>
            </div>
          ) : (
            <div className={styles.rosterGrid}>
              {featured && <FriendCard friend={featured} />}
              {rest.map((p) => (
                <FriendCard key={p.id} friend={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PersonDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
