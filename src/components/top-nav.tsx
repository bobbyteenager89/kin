'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className={styles.topNav}>
      <Link href="/" className={styles.brand}>kin</Link>

      <div className={styles.searchPill}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Find a friend..."
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      <nav className={styles.navRight}>
        <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}>
          Dashboard
        </Link>
        <Link href="/wishlist" className={`${styles.navLink} ${isActive('/wishlist') ? styles.navLinkActive : ''}`}>
          Wishlist
        </Link>
        <Link href="/settings" className={`${styles.navLink} ${isActive('/settings') ? styles.navLinkActive : ''}`}>
          Settings
        </Link>
        {onAddPerson && (
          <button className={styles.btnPrimary} onClick={onAddPerson}>
            + Add Person
          </button>
        )}
        <NotificationBell initialNotifications={notifications} />
        <UserButton />
      </nav>
    </header>
  );
}
