import styles from './hud.module.css';

interface GameHeaderProps {
  locationName: string;
  title: string;
  day: number;
}

export function GameHeader({ locationName, title, day }: GameHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.location}>{locationName}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.day}>Day {day}</p>
    </header>
  );
}
