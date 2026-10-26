import styles from './GameToast.module.css';

export interface GameToastItem {
  id: string;
  title: string;
  detail?: string;
  kind?: 'default' | 'levelup';
}

interface GameToastProps {
  items: readonly GameToastItem[];
}

export function GameToast({ items }: GameToastProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className={styles.stack} aria-live="polite">
      {items.map((item) => (
        <article
          className={`${styles.toast} ${item.kind === 'levelup' ? styles.levelUp : ''}`}
          key={item.id}
        >
          <p className={styles.title}>{item.title}</p>
          {item.detail ? <p className={styles.detail}>{item.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}
