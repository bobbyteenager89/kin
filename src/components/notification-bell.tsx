'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications';
import styles from './notification-bell.module.css';

interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

interface NotificationBellProps {
  initialNotifications: Notification[];
}

function formatNotificationTitle(n: Notification): string {
  switch (n.type) {
    case 'added_to_circle':
      return 'Someone was added to your circle';
    case 'address_request': {
      const completed = n.data?.completed as boolean | undefined;
      const name = n.data?.personName as string | undefined;
      if (completed) return `Address received${name ? ` from ${name}` : ''}`;
      return `Address request sent${name ? ` to ${name}` : ''}`;
    }
    case 'birthday_reminder': {
      const name = n.data?.personName as string | undefined;
      return name ? `${name}'s birthday is coming up` : 'Birthday coming up';
    }
    case 'verify_address':
      return 'Address may need verification';
    case 'wishlist_purchased':
      return 'Something on your wishlist was purchased';
    default:
      return 'New notification';
  }
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        className={styles.bell}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button
                className={styles.markAllBtn}
                onClick={handleMarkAllRead}
                disabled={isPending}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔔</span>
              <p>Nothing yet</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                >
                  <div className={styles.itemContent}>
                    <p className={styles.itemTitle}>{formatNotificationTitle(n)}</p>
                    <p className={styles.itemTime}>{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className={styles.unreadDot} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
