import { SearchIcon } from './SearchIcon';
import styles from './TopNav.module.css';

export function TopNav() {
  return (
    <header className={styles.topNav}>
      <div className={styles.brand}>kin</div>

      <div className={styles.searchPill}>
        <SearchIcon />
        <input type="text" placeholder="Find a friend..." />
      </div>

      <button className={styles.btnPrimary}>+ Add Person</button>
    </header>
  );
}
