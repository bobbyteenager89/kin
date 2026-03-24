'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/config';
import { updateUserProfile } from '@/lib/actions/settings';
import { createPerson } from '@/lib/actions/persons';
import { createAddressRequest } from '@/lib/actions/address-requests';
import styles from './onboarding.module.css';

interface OnboardingClientProps {
  userId: string;
  clerkName: string;
}

type Step = 1 | 2 | 3 | 4;

export function OnboardingClient({ userId, clerkName }: OnboardingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [phone, setPhone] = useState('');

  // Step 2
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [friendRelation, setFriendRelation] = useState('');
  const [savedPersonId, setSavedPersonId] = useState<string | null>(null);

  // Step 1 submit
  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await updateUserProfile({ phone: phone.trim() || null });
        setStep(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  // Step 2 submit
  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const person = await createPerson({
          name: friendName.trim(),
          phone: friendPhone.trim() || null,
          relation: friendRelation.trim() || null,
          tier: 'inner_circle',
        });
        setSavedPersonId(person.id);
        setStep(3);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  // Step 3 submit — send address request
  function handleStep3() {
    setError(null);
    if (!savedPersonId) {
      setStep(4);
      return;
    }

    startTransition(async () => {
      try {
        await createAddressRequest(
          savedPersonId,
          `Hi! I'm collecting addresses to stay connected. Mind sharing yours?`,
          friendPhone || undefined
        );
        setStep(4);
      } catch (err) {
        // Non-fatal — proceed even if request fails
        setStep(4);
      }
    });
  }

  function handleSkipStep3() {
    setStep(4);
  }

  // Step 4 finish
  function handleFinish() {
    router.push('/');
  }

  const firstName = clerkName.split(' ')[0] || 'there';

  return (
    <div className={styles.container}>
      {/* Progress dots */}
      <div className={styles.progress}>
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div
            key={s}
            className={`${styles.progressDot} ${step >= s ? styles.progressDotActive : ''}`}
          />
        ))}
      </div>

      {/* Step 1: Welcome + phone */}
      {step === 1 && (
        <form onSubmit={handleStep1} className={styles.stepForm}>
          <div className={styles.emoji}>🎁</div>
          <h1 className={styles.title}>Welcome to {APP_NAME}, {firstName}!</h1>
          <p className={styles.subtitle}>
            {APP_NAME} helps you remember the people who matter most — birthdays, addresses, wishlists.
          </p>
          <p className={styles.subtitle}>First, what&apos;s your phone number?</p>

          <label className={styles.field}>
            <span className={styles.label}>Your phone (optional)</span>
            <input
              className={styles.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-555-5555"
              autoFocus
            />
            <span className={styles.fieldHint}>Used to send you reminders — never shared publicly</span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.nextBtn} disabled={isPending}>
            {isPending ? 'Saving...' : 'Let\'s go →'}
          </button>
        </form>
      )}

      {/* Step 2: Add first friend */}
      {step === 2 && (
        <form onSubmit={handleStep2} className={styles.stepForm}>
          <div className={styles.emoji}>👋</div>
          <h1 className={styles.title}>Add your first friend</h1>
          <p className={styles.subtitle}>
            Who&apos;s someone important to you? Start with one person.
          </p>

          <label className={styles.field}>
            <span className={styles.label}>Their name *</span>
            <input
              className={styles.input}
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="e.g. Mom, Alex, Sarah"
              required
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Relation</span>
            <input
              className={styles.input}
              value={friendRelation}
              onChange={(e) => setFriendRelation(e.target.value)}
              placeholder="e.g. Mom, Best friend, College roommate"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Their phone (for address request)</span>
            <input
              className={styles.input}
              type="tel"
              value={friendPhone}
              onChange={(e) => setFriendPhone(e.target.value)}
              placeholder="+1 555-555-5555"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.stepActions}>
            <button
              type="button"
              className={styles.skipBtn}
              onClick={() => router.push('/')}
            >
              Skip for now
            </button>
            <button type="submit" className={styles.nextBtn} disabled={isPending || !friendName.trim()}>
              {isPending ? 'Saving...' : 'Next →'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Send address request */}
      {step === 3 && (
        <div className={styles.stepForm}>
          <div className={styles.emoji}>📬</div>
          <h1 className={styles.title}>Request their address</h1>
          <p className={styles.subtitle}>
            Send {friendName} a quick link to share their address with you.
            They just fill out a form — no signup needed.
          </p>

          {friendPhone ? (
            <div className={styles.previewCard}>
              <p className={styles.previewLabel}>Message preview</p>
              <p className={styles.previewText}>
                &quot;Hi! I&apos;m collecting addresses to stay connected. Mind sharing yours?&quot;
              </p>
              <p className={styles.previewSentTo}>Sending to {friendPhone}</p>
            </div>
          ) : (
            <div className={styles.noPhoneNote}>
              You can still send the request — we&apos;ll generate a link you can share manually.
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.stepActions}>
            <button type="button" className={styles.skipBtn} onClick={handleSkipStep3}>
              Skip for now
            </button>
            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleStep3}
              disabled={isPending}
            >
              {isPending ? 'Sending...' : 'Send request →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: All set */}
      {step === 4 && (
        <div className={styles.stepForm}>
          <div className={styles.emoji}>✨</div>
          <h1 className={styles.title}>You&apos;re all set!</h1>
          <p className={styles.subtitle}>
            {APP_NAME} is ready. You can add more friends, set up your wishlist,
            and never miss a birthday again.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🎂</span>
              <span>Birthday reminders before it&apos;s too late</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📬</span>
              <span>Address requests friends can fill out in seconds</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🎁</span>
              <span>Wishlists your inner circle can actually use</span>
            </div>
          </div>

          <button type="button" className={styles.nextBtn} onClick={handleFinish}>
            Go to my dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
