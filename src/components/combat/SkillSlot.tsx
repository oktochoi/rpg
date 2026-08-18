import type { CombatHudSkillSlot } from '@/game/combat/hud/combat-hud-types';
import styles from './CombatHUD.module.css';

interface SkillSlotProps {
  slot: CombatHudSkillSlot;
  currentMp: number;
}

export function SkillSlot({ slot, currentMp }: SkillSlotProps) {
  const cooling = slot.currentCooldown > 0;
  const mpShort = slot.implemented && currentMp < slot.mpCost;
  const seconds = Math.max(0, slot.currentCooldown / 1000);
  const ratio = slot.maxCooldown > 0 ? Math.min(1, slot.currentCooldown / slot.maxCooldown) : 0;

  return (
    <div
      className={`${styles.slot} ${slot.available ? '' : styles.slotDisabled}`}
      title={mpShort ? 'MP 부족' : undefined}
      data-skill={slot.skillId ?? ''}
    >
      <p className={styles.slotKey}>{slot.key}</p>
      <div className={styles.cooldown}>
        <div className={styles.icon} data-icon={slot.icon} />
        {cooling ? (
          <div className={styles.cooldownOverlay} style={{ opacity: 0.45 + ratio * 0.4 }}>
            {seconds.toFixed(1)}
          </div>
        ) : null}
      </div>
      <p className={styles.slotName}>{slot.name}</p>
    </div>
  );
}
