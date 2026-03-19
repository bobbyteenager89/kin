'use client';

import { useState, useTransition } from 'react';
import * as chrono from 'chrono-node';
import { createPerson, updatePerson } from '@/lib/actions/persons';
import type { PersonInput } from '@/lib/validators/person';
import styles from './person-drawer.module.css';

type Tier = 'everyone' | 'friends' | 'inner_circle';

interface ChildRow {
  name: string;
  birthday: string;
}

interface PersonDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Pass person data to edit an existing person */
  person?: {
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
    tags?: string[];
    notes?: string | null;
    tier: Tier;
    children?: { name: string; birthday?: string | null }[];
  };
}

const TIER_OPTIONS: { value: Tier; label: string; desc: string }[] = [
  { value: 'everyone', label: 'Everyone', desc: 'Default' },
  { value: 'friends', label: 'Friends', desc: 'Close friends' },
  { value: 'inner_circle', label: 'Inner Circle', desc: 'Very close' },
];

function parseDateInput(raw: string): string | null {
  if (!raw.trim()) return null;
  // Try ISO date first
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // Try natural language with chrono
  const result = chrono.parseDate(raw);
  if (result) {
    return result.toISOString().split('T')[0];
  }
  return null;
}

export function PersonDrawer({ open, onClose, onSaved, person }: PersonDrawerProps) {
  const isEdit = !!person;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(person?.name ?? '');
  const [nickname, setNickname] = useState(person?.nickname ?? '');
  const [relation, setRelation] = useState(person?.relation ?? '');
  const [birthday, setBirthday] = useState(person?.birthday ?? '');
  const [partnerName, setPartnerName] = useState(person?.partnerName ?? '');
  const [weddingAnniversary, setWeddingAnniversary] = useState(person?.weddingAnniversary ?? '');
  const [street, setStreet] = useState(person?.address?.street ?? '');
  const [city, setCity] = useState(person?.address?.city ?? '');
  const [state, setState] = useState(person?.address?.state ?? '');
  const [zip, setZip] = useState(person?.address?.zip ?? '');
  const [phone, setPhone] = useState(person?.phone ?? '');
  const [email, setEmail] = useState(person?.email ?? '');
  const [tags, setTags] = useState((person?.tags ?? []).join(', '));
  const [notes, setNotes] = useState(person?.notes ?? '');
  const [tier, setTier] = useState<Tier>(person?.tier ?? 'everyone');
  const [personChildren, setPersonChildren] = useState<ChildRow[]>(
    person?.children?.map((c) => ({ name: c.name, birthday: c.birthday ?? '' })) ?? []
  );

  function addChild() {
    setPersonChildren((prev) => [...prev, { name: '', birthday: '' }]);
  }

  function removeChild(index: number) {
    setPersonChildren((prev) => prev.filter((_, i) => i !== index));
  }

  function updateChild(index: number, field: keyof ChildRow, value: string) {
    setPersonChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: PersonInput = {
      name: name.trim(),
      nickname: nickname.trim() || null,
      relation: relation.trim() || null,
      birthday: parseDateInput(birthday),
      partnerName: partnerName.trim() || null,
      weddingAnniversary: parseDateInput(weddingAnniversary),
      address:
        street || city || state || zip
          ? { street: street || undefined, city: city || undefined, state: state || undefined, zip: zip || undefined }
          : null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      notes: notes.trim() || null,
      tier,
      children: personChildren
        .filter((c) => c.name.trim())
        .map((c) => ({ name: c.name.trim(), birthday: parseDateInput(c.birthday) })),
    };

    startTransition(async () => {
      try {
        if (isEdit && person) {
          await updatePerson(person.id, input);
        } else {
          await createPerson(input);
        }
        onSaved?.();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            {isEdit ? 'Edit Person' : 'Add Person'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Basic info */}
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>About</h3>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.label}>Name *</span>
                <input
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Nickname</span>
                <input
                  className={styles.input}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="What you call them"
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>Relation</span>
              <input
                className={styles.input}
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="e.g. College roommate, Sister-in-law"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Birthday</span>
              <input
                className={styles.input}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="Oct 28 or 1990-10-28 or next Friday"
              />
            </label>
          </section>

          {/* Partner */}
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>Partner</h3>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.label}>Partner's name</span>
                <input
                  className={styles.input}
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Partner's name"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Anniversary</span>
                <input
                  className={styles.input}
                  value={weddingAnniversary}
                  onChange={(e) => setWeddingAnniversary(e.target.value)}
                  placeholder="Nov 14 or 2018-11-14"
                />
              </label>
            </div>
          </section>

          {/* Children */}
          <section className={styles.section}>
            <div className={styles.sectionRow}>
              <h3 className={styles.sectionLabel}>Children</h3>
              <button type="button" className={styles.addChildBtn} onClick={addChild}>
                + Add
              </button>
            </div>
            {personChildren.map((child, i) => (
              <div key={i} className={styles.childRow}>
                <input
                  className={styles.input}
                  value={child.name}
                  onChange={(e) => updateChild(i, 'name', e.target.value)}
                  placeholder="Name"
                />
                <input
                  className={styles.input}
                  value={child.birthday}
                  onChange={(e) => updateChild(i, 'birthday', e.target.value)}
                  placeholder="Birthday"
                />
                <button
                  type="button"
                  className={styles.removeChildBtn}
                  onClick={() => removeChild(i)}
                  aria-label="Remove child"
                >
                  ✕
                </button>
              </div>
            ))}
          </section>

          {/* Address */}
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>Address</h3>
            <label className={styles.field}>
              <span className={styles.label}>Street</span>
              <input
                className={styles.input}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="123 Main St"
              />
            </label>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.label}>City</span>
                <input
                  className={styles.input}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Austin"
                />
              </label>
              <label className={`${styles.field} ${styles.fieldSm}`}>
                <span className={styles.label}>State</span>
                <input
                  className={styles.input}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="TX"
                />
              </label>
              <label className={`${styles.field} ${styles.fieldSm}`}>
                <span className={styles.label}>ZIP</span>
                <input
                  className={styles.input}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="78701"
                />
              </label>
            </div>
          </section>

          {/* Contact */}
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>Contact</h3>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.label}>Phone</span>
                <input
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-555-5555"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                />
              </label>
            </div>
          </section>

          {/* Tier */}
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>Circle Tier</h3>
            <div className={styles.tierOptions}>
              {TIER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.tierBtn} ${tier === opt.value ? styles.tierBtnActive : ''}`}
                  onClick={() => setTier(opt.value)}
                >
                  <span className={styles.tierBtnLabel}>{opt.label}</span>
                  <span className={styles.tierBtnDesc}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Tags & Notes */}
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>Tags &amp; Notes</h3>
            <label className={styles.field}>
              <span className={styles.label}>Tags (comma separated)</span>
              <input
                className={styles.input}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Vegan, Dog lover, Book club"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Notes</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else worth remembering..."
                rows={4}
              />
            </label>
          </section>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Person'}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
