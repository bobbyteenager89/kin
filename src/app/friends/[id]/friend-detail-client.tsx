'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PersonDrawer } from '@/components/person-drawer';
import { AddressRequestButton } from '@/components/address-request-button';
import { deletePerson, markCaughtUp } from '@/lib/actions/persons';
import styles from './page.module.css';

interface Person {
  id: string;
  name: string;
  nickname?: string | null;
  relation?: string | null;
  birthday?: string | null;
  partnerName?: string | null;
  weddingAnniversary?: string | null;
  address?: { street?: string; city?: string; state?: string; zip?: string } | null;
  phone?: string | null;
  email?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  tier: 'everyone' | 'friends' | 'inner_circle';
  children?: { id: string; name: string; birthday?: string | null }[];
}

interface FriendDetailClientProps {
  person: Person;
}

function MarkCaughtUpButton({ personId }: { personId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await markCaughtUp(personId);
      router.refresh();
    });
  }

  return (
    <button
      className={styles.btnSecondary}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? 'Saving...' : 'Mark as caught up'}
    </button>
  );
}

function FriendDetailClientInner({ person }: FriendDetailClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete ${person.name}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deletePerson(person.id);
      router.push('/');
    });
  }

  return (
    <>
      <AddressRequestButton personId={person.id} personName={person.name} />
      <button
        className={styles.btnSecondary}
        onClick={() => setDrawerOpen(true)}
      >
        Edit
      </button>
      <button
        className={styles.btnDanger}
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>

      <PersonDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          router.refresh();
        }}
        person={{
          ...person,
          tags: person.tags ?? [],
        }}
      />
    </>
  );
}

// Attach MarkCaughtUp as a static property so the server component can use it
FriendDetailClientInner.MarkCaughtUp = MarkCaughtUpButton;

export const FriendDetailClient = FriendDetailClientInner;
