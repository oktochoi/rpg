import { PLAYER_CLASSES, PLAYER_CLASS_ID, type PlayerClassId } from '@/game/player/classes';
import { audioManager, SFX_ID } from '@/game/audio';
import { PlayerVisualPreview } from './PlayerVisualPreview';
import styles from './FirstAdvancement.module.css';

interface FirstAdvancementProps {
  onSelect: (classId: PlayerClassId) => void;
}

const PATHS: readonly PlayerClassId[] = [PLAYER_CLASS_ID.WARRIOR, PLAYER_CLASS_ID.MAGE, PLAYER_CLASS_ID.ROGUE];

export function FirstAdvancement({ onSelect }: FirstAdvancementProps) {
  return (
    <div className={styles.overlay}>
      <section className={styles.panel} aria-label="첫 전직">
        <p className={styles.kicker}>FIRST ADVANCEMENT AVAILABLE</p>
        <h2>앞으로의 길을 선택하라</h2>
        <p>한 번 정한 길은 되돌릴 수 없다.</p>
        <div className={styles.grid}>
          {PATHS.map((id) => {
            const definition = PLAYER_CLASSES[id];
            return (
              <button
                key={id}
                type="button"
                className={styles.card}
                onClick={() => {
                  audioManager.playSfx(SFX_ID.UI_CONFIRM);
                  onSelect(id);
                }}
              >
                <PlayerVisualPreview jobId={id} size="lg" alt={definition.name} />
                <p className={styles.fromTo}>모험가 → {definition.name}</p>
                <h3>{id === PLAYER_CLASS_ID.WARRIOR ? '검사의 길' : id === PLAYER_CLASS_ID.MAGE ? '마법사의 길' : '도적의 길'}</h3>
                <p>{definition.playStyle}</p>
                <p>{definition.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
