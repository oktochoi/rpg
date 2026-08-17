import styles from './dialogue.module.css';

interface NpcPortraitProps {
  npcName: string;
}

export function NpcPortrait({ npcName }: NpcPortraitProps) {
  return (
    <div className={styles.portrait}>
      <div className={styles.frame} aria-hidden="true">
        <span className={styles.placeholder}>Portrait</span>
        <div className={styles.silhouette} />
      </div>
      <p className={styles.name}>{npcName}</p>
    </div>
  );
}
