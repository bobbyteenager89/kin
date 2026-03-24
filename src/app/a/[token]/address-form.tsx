'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/config';
import { completeAddressRequest } from '@/lib/actions/address-requests';
import styles from './page.module.css';

interface AddressFormProps {
  token: string;
  senderName: string;
  message: string | null;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function AddressForm({ token, senderName, message }: AddressFormProps) {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setErrorMsg('Please fill in all address fields.');
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      setFormState('submitting');
      try {
        const result = await completeAddressRequest(token, {
          street,
          city,
          state,
          zip,
          birthday: birthday.trim() || undefined,
          phone: phone.trim() || undefined,
        });

        if (result.success) {
          setFormState('success');
        } else {
          setFormState('error');
          setErrorMsg('Something went wrong. Please try again.');
        }
      } catch {
        setFormState('error');
        setErrorMsg('Something went wrong. Please try again.');
      }
    });
  }

  if (formState === 'success') {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <span className={styles.successIcon}>💌</span>
          <h1 className={styles.successTitle}>Address sent!</h1>
          <p className={styles.successBody}>
            {senderName} will be able to send you something special. Thank you for sharing.
          </p>

          <hr className={styles.ctaDivider} />

          <p className={styles.ctaHeading}>
            Want to know when {senderName}&rsquo;s birthday is?
          </p>
          <Link href="/sign-up" className={styles.ctaBtn}>
            Create your free {APP_NAME}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.formTitle}>Your mailing address</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="street">Street address</label>
        <input
          id="street"
          className={styles.input}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="123 Main Street, Apt 4B"
          autoComplete="street-address"
          required
        />
      </div>

      <div className={styles.fieldRowThree}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="city">City</label>
          <input
            id="city"
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Austin"
            autoComplete="address-level2"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="state">State</label>
          <input
            id="state"
            className={styles.input}
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="TX"
            autoComplete="address-level1"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="zip">ZIP</label>
          <input
            id="zip"
            className={styles.input}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="78701"
            autoComplete="postal-code"
            required
          />
        </div>
      </div>

      <div className={styles.optionalSection}>
        <p className={styles.optionalLabel}>A little more about you</p>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="birthday">Birthday</label>
            <input
              id="birthday"
              className={styles.input}
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              placeholder="Oct 28"
              autoComplete="bday"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Phone</label>
            <input
              id="phone"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-555-5555"
              autoComplete="tel"
              type="tel"
            />
          </div>
        </div>
      </div>

      {errorMsg && <p className={styles.error}>{errorMsg}</p>}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isPending || formState === 'submitting'}
      >
        {isPending || formState === 'submitting' ? 'Sending...' : 'Share my address'}
      </button>
    </form>
  );
}
