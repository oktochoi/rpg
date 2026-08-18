import styles from './hud.module.css';

interface GameHeaderProps {
  locationName: string;
  title: string;
  day: number;
  clock?: string;
  progressLabel?: string;
}

export function GameHeader({ locationName, title, day, clock, progressLabel }: GameHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.location}>{locationName}</p>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {progressLabel ? <p className={styles.day}>{progressLabel}</p> : null}
      </div>
      <p className={styles.day}>{clock ?? `DAY ${day}`}</p>
    </header>
  );
}
