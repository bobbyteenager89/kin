'use client';

import { useState, useTransition } from 'react';
import { createAddressRequest } from '@/lib/actions/address-requests';
import { APP_NAME } from '@/lib/config';
import styles from './address-request-button.module.css';

interface AddressRequestButtonProps {
  personId: string;
  personName: string;
  /** If set, pre-fill the button label */
  label?: string;
}

type ModalState = 'form' | 'link';

export function AddressRequestButton({ personId, personName, label }: AddressRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('form');
  const [recipientContact, setRecipientContact] = useState('');
  const [message, setMessage] = useState('');
  const [tokenUrl, setTokenUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setOpen(true);
    setModalState('form');
    setRecipientContact('');
    setMessage('');
    setTokenUrl('');
    setCopied(false);
    setError(null);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const isPhone = /^\+?[\d\s\-()]{7,}$/.test(recipientContact);
    const isEmail = recipientContact.includes('@');

    startTransition(async () => {
      try {
        const result = await createAddressRequest(
          personId,
          message.trim() || undefined,
          isPhone ? recipientContact.trim() : undefined,
          isEmail ? recipientContact.trim() : undefined
        );
        setTokenUrl(result.tokenUrl);
        setModalState('link');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(tokenUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = tokenUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleSmsShare() {
    const smsBody = encodeURIComponent(
      `Hey! I'd love to send you something — can you share your address? ${tokenUrl}`
    );
    window.open(`sms:${recipientContact}?body=${smsBody}`, '_blank');
  }

  return (
    <>
      <button className={styles.triggerBtn} onClick={handleOpen}>
        {label ?? 'Request Address'}
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={handleClose} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modalState === 'form' ? `Ask ${personName} for their address` : 'Your link is ready'}
              </h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                ✕
              </button>
            </div>

            {modalState === 'form' ? (
              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.field}>
                  <span className={styles.label}>Their phone or email</span>
                  <input
                    className={styles.input}
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    placeholder="+1 555-555-5555 or friend@example.com"
                    autoFocus
                  />
                  <span className={styles.hint}>Optional — for SMS/email delivery</span>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Personal message</span>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`e.g. "Happy holidays! Would love to send you a little something 🎁"`}
                    rows={3}
                  />
                </label>

                {/* Preview */}
                {message && (
                  <div className={styles.preview}>
                    <p className={styles.previewLabel}>What they&apos;ll see</p>
                    <p className={styles.previewMessage}>&ldquo;{message}&rdquo;</p>
                  </div>
                )}

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.formActions}>
                  <button type="button" className={styles.cancelBtn} onClick={handleClose}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.linkPanel}>
                <p className={styles.linkDescription}>
                  Share this link with {personName}. It expires in 7 days.
                </p>

                <div className={styles.linkBox}>
                  <span className={styles.linkUrl}>{tokenUrl}</span>
                </div>

                <div className={styles.linkActions}>
                  <button className={styles.copyBtn} onClick={handleCopy}>
                    {copied ? '✓ Copied!' : 'Copy link'}
                  </button>

                  {recipientContact && (
                    <button className={styles.smsBtn} onClick={handleSmsShare}>
                      Send via iMessage
                    </button>
                  )}
                </div>

                <p className={styles.linkNote}>
                  When {personName} fills out the form, their address will automatically appear in {APP_NAME}.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
