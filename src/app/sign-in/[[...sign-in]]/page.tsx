import { SignIn } from '@clerk/nextjs';
import { APP_NAME_LOWER } from '@/lib/config';
import styles from './page.module.css';

export default function SignInPage() {
  return (
    <div className={styles.authCenter}>
      <div className={styles.brand}>{APP_NAME_LOWER}</div>
      <SignIn />
    </div>
  );
}
