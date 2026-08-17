import type { NpcRelationView, QuestPanelView } from './types';
import { QuestPanel } from './QuestPanel';
import styles from './InfoPanel.module.css';

interface InfoPanelProps {
  quest: QuestPanelView;
  relations: readonly NpcRelationView[];
}

export function InfoPanel({ quest, relations }: InfoPanelProps) {
  return (
    <aside className={styles.panel} aria-label="정보">
      <QuestPanel quest={quest} />
      <section aria-label="주요 NPC 관계">
        <p className={styles.sectionTitle}>주요 NPC 관계</p>
        <ul className={styles.list}>
          {relations.map((relation) => (
            <li className={styles.item} key={relation.npcName}>
              <span>{relation.npcName}</span>
              <span className={styles.relation}>{relation.relation}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
