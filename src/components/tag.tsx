import styles from './tag.module.css';

interface TagProps {
  label: string;
  variant?: 'default' | 'featured';
}

export function Tag({ label, variant = 'default' }: TagProps) {
  return (
    <span className={`${styles.tag} ${variant === 'featured' ? styles.featured : ''}`}>
      {label}
    </span>
  );
}
