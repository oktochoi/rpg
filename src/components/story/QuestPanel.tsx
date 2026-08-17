import type { QuestPanelView } from './types';
import styles from './InfoPanel.module.css';

interface QuestPanelProps {
  quest: QuestPanelView;
}

export function QuestPanel({ quest }: QuestPanelProps) {
  return (
    <section aria-label="현재 퀘스트">
      <p className={styles.sectionTitle}>현재 Quest</p>
      <h2 className={styles.questTitle}>{quest.title}</h2>
      <p className={styles.status}>{quest.status}</p>
      <p className={styles.summary}>{quest.summary}</p>
    </section>
  );
}
