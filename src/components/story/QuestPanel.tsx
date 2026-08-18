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
      {quest.currentObjective ? <p className={styles.current}>현재 목표 · {quest.currentObjective}</p> : null}
      {quest.objectives.length > 0 ? (
        <ul className={styles.objectives}>
          {quest.objectives.map((objective) => (
            <li key={objective.id}>
              {objective.completed ? '✓' : '□'} {objective.description}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.summary}>{quest.summary}</p>
      )}
    </section>
  );
}
