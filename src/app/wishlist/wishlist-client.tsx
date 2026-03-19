'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addWishlistItem, removeWishlistItem, updateWishlistItem } from '@/lib/actions/wishlists';
import styles from './wishlist.module.css';

interface WishlistItem {
  id: string;
  title: string;
  url: string | null;
  notes: string | null;
  priority: number;
}

interface WishlistClientProps {
  wishlistId: string;
  initialItems: WishlistItem[];
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'High',
  2: 'Medium',
  3: 'Low',
};

export function WishlistClient({ wishlistId, initialItems }: WishlistClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState(2);
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPriority, setEditPriority] = useState(2);

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await addWishlistItem(wishlistId, { title, url: url || undefined, notes: notes || undefined, priority });
        setTitle('');
        setUrl('');
        setNotes('');
        setPriority(2);
        setShowAddForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  function startEdit(item: WishlistItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditUrl(item.url ?? '');
    setEditNotes(item.notes ?? '');
    setEditPriority(item.priority);
  }

  function handleEditSubmit(e: React.FormEvent, itemId: string) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await updateWishlistItem(itemId, {
          title: editTitle,
          url: editUrl || null,
          notes: editNotes || null,
          priority: editPriority,
        });
        setEditingId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  function handleRemove(itemId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeWishlistItem(itemId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  const sortedItems = [...initialItems].sort((a, b) => a.priority - b.priority);

  return (
    <div className={styles.container}>
      <div className={styles.shareNote}>
        <span className={styles.shareIcon}>🔗</span>
        <span>Share your wishlist with your Inner Circle so friends know what to get you</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Add item form */}
      {showAddForm ? (
        <form onSubmit={handleAddSubmit} className={styles.addForm}>
          <h3 className={styles.addFormTitle}>Add an item</h3>
          <label className={styles.field}>
            <span className={styles.label}>What do you want? *</span>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Le Creuset Dutch Oven in Cerise"
              required
              autoFocus
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Link (optional)</span>
            <input
              className={styles.input}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Notes (optional)</span>
            <input
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Size, color, any specifics..."
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Priority</span>
            <select
              className={styles.input}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <option value={1}>High — really want this</option>
              <option value={2}>Medium — would love it</option>
              <option value={3}>Low — nice to have</option>
            </select>
          </label>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.addBtn} disabled={isPending || !title.trim()}>
              {isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      ) : (
        <button className={styles.addBtn} onClick={() => setShowAddForm(true)}>
          + Add Item
        </button>
      )}

      {/* Items list */}
      {sortedItems.length === 0 && !showAddForm && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Your wishlist is empty</p>
          <p className={styles.emptySubtext}>
            Add items so your friends know what to get you for birthdays and holidays.
          </p>
        </div>
      )}

      <div className={styles.itemsList}>
        {sortedItems.map((item) => (
          <div key={item.id} className={styles.itemCard}>
            {editingId === item.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, item.id)} className={styles.editForm}>
                <input
                  className={styles.input}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  autoFocus
                />
                <input
                  className={styles.input}
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="Link (optional)"
                />
                <input
                  className={styles.input}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes (optional)"
                />
                <select
                  className={styles.input}
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                >
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
                <div className={styles.formActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.addBtn} disabled={isPending}>
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <span className={`${styles.priorityBadge} ${styles[`priority${item.priority}`]}`}>
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                    <h3 className={styles.itemTitle}>{item.title}</h3>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.itemLink}
                    >
                      View item →
                    </a>
                  )}
                  {item.notes && <p className={styles.itemNotes}>{item.notes}</p>}
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.editBtn} onClick={() => startEdit(item)}>
                    Edit
                  </button>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
