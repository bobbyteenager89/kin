'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { SearchIcon } from './search-icon';
import { NotificationBell } from './notification-bell';
import styles from './top-nav.module.css';

interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

interface TopNavProps {
  onSearch?: (query: string) => void;
  onAddPerson?: () => void;
  notifications?: Notification[];
}

export function TopNav({ onSearch, onAddPerson, notifications = [] }: TopNavProps) {
  return (
    <header className={styles.topNav}>
      <Link href="/" className={styles.brand}>Kin</Link>

      <div className={styles.navRight}>
        {onAddPerson && (
          <button className={styles.addBtn} onClick={onAddPerson} aria-label="Add person">
            +
          </button>
        )}
        <NotificationBell initialNotifications={notifications} />
        <button
          className={styles.searchBtn}
          onClick={() => {
            const query = prompt('Search friends...');
            if (query !== null) onSearch?.(query);
          }}
          aria-label="Search"
        >
          <SearchIcon />
        </button>
        <UserButton />
      </div>
    </header>
  );
}
