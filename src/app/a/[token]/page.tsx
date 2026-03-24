import type { Metadata } from 'next';
import { getAddressRequestByToken } from '@/lib/actions/address-requests';
import { APP_NAME, APP_NAME_LOWER } from '@/lib/config';
import { AddressForm } from './address-form';
import styles from './page.module.css';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const request = await getAddressRequestByToken(token);
  const senderName = request?.senderName ?? 'Someone';

  return {
    title: `${senderName} wants to send you something — ${APP_NAME}`,
    description: 'Share your address securely. Takes 30 seconds.',
    openGraph: {
      title: `🎁 ${senderName} wants to send you something`,
      description: `Tap to share your address securely with ${APP_NAME}`,
      type: 'website',
      images: ['/og-address-request.png'],
    },
  };
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AddressRequestPage({ params }: PageProps) {
  const { token } = await params;
  const request = await getAddressRequestByToken(token);

  // ── Invalid token ──────────────────────────────────────────────────────────
  if (!request) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCard}>
          <span className={styles.stateIcon}>🔍</span>
          <h1 className={styles.stateTitle}>Link not found</h1>
          <p className={styles.stateBody}>
            This link doesn&rsquo;t seem to exist. Double-check the URL, or ask your friend to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // ── Already completed ──────────────────────────────────────────────────────
  if (request.status === 'completed') {
    return (
      <div className={styles.page}>
        <div className={styles.stateCard}>
          <span className={styles.stateIcon}>✅</span>
          <h1 className={styles.stateTitle}>Already shared</h1>
          <p className={styles.stateBody}>
            You&rsquo;ve already shared your address with {request.senderName}. Thank you!
          </p>
        </div>
      </div>
    );
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (request.status === 'expired' || request.expiresAt < new Date()) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCard}>
          <span className={styles.stateIcon}>⏰</span>
          <h1 className={styles.stateTitle}>Link expired</h1>
          <p className={styles.stateBody}>
            This request has expired. Ask {request.senderName} to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // ── Valid — show form ──────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.envelope}>
        <div className={styles.card}>
          {/* Decorative postmark stamp */}
          <div className={styles.stamp} aria-hidden="true">
            <span className={styles.stampInner}>{APP_NAME_LOWER}</span>
            <span className={styles.stampYear}>address</span>
          </div>

          <div className={styles.cardInner}>
            <span className={styles.giftIcon} aria-hidden="true">🎁</span>
            <h1 className={styles.heading}>
              {request.senderName} wants to send you something
            </h1>
            <p className={styles.subheading}>
              Share your address so they can send you a gift
            </p>

            {request.message && (
              <div className={styles.messageBox}>
                <span className={styles.messageLabel}>A note from {request.senderName}</span>
                <p className={styles.messageText}>&ldquo;{request.message}&rdquo;</p>
              </div>
            )}

            <hr className={styles.divider} />

            <AddressForm
              token={token}
              senderName={request.senderName}
              message={request.message}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
