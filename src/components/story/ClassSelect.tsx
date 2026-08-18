import { PLAYER_CLASSES, type PlayerClassId } from '@/game/player/classes';
import { getSkill } from '@/game/combat/skills/skill-definitions';
import { audioManager, SFX_ID } from '@/game/audio';
import styles from './ClassSelect.module.css';

interface ClassSelectProps {
  onSelect: (classId: PlayerClassId) => void;
}

export function ClassSelect({ onSelect }: ClassSelectProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-label="직업 선택">
      <section className={styles.panel}>
        <p className={styles.kicker}>NEW GAME</p>
        <h2 className={styles.title}>직업을 선택하세요</h2>
        <div className={styles.grid}>
          {(Object.keys(PLAYER_CLASSES) as PlayerClassId[]).map((classId) => {
            const definition = PLAYER_CLASSES[classId];
            const skills = definition.combat.skillIds
              .map((id) => getSkill(id)?.name)
              .filter((name): name is string => Boolean(name));
            return (
              <button
                className={styles.card}
                key={classId}
                type="button"
                onClick={() => {
                  audioManager.unlock();
                  audioManager.playSfx(SFX_ID.UI_CONFIRM);
                  onSelect(classId);
                }}
              >
                <h3>{definition.name}</h3>
                <p className={styles.style}>{definition.playStyle}</p>
                <p>{definition.description}</p>
                <p className={styles.stats}>
                  HP {definition.baseStats.maxHp} · MP {definition.baseStats.maxMp}
                </p>
                <p className={styles.skills}>{skills.join(' / ')}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
