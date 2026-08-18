import type { NpcRelationView, QuestPanelView } from './types';
import { QuestPanel } from './QuestPanel';
import styles from './InfoPanel.module.css';

interface InfoPanelProps {
  quest: QuestPanelView;
  relations: readonly NpcRelationView[];
  mainObjective?: string;
}

export function InfoPanel({ quest, relations, mainObjective }: InfoPanelProps) {
  return (
    <aside className={styles.panel} aria-label="정보">
      {mainObjective ? (
        <section aria-label="현재 목표">
          <p className={styles.sectionTitle}>현재 목표</p>
          <p>{mainObjective}</p>
        </section>
      ) : null}
      <QuestPanel quest={quest} />
      <section aria-label="주요 NPC 관계">
        <p className={styles.sectionTitle}>주요 NPC 관계</p>
        <ul className={styles.list}>
          {relations.map((relation) => (
            <li className={styles.item} key={relation.npcName}>
              <div>
                <span>{relation.npcName}</span>
                <span className={styles.relation}> {relation.relation}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
