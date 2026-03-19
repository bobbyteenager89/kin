import { SignUp } from '@clerk/nextjs';
import styles from './page.module.css';

export default function SignUpPage() {
  return (
    <div className={styles.authCenter}>
      <div className={styles.brand}>kin</div>
      <SignUp />
    </div>
  );
}
