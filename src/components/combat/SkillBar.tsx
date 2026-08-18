import type { CombatHudState } from '@/game/combat/hud/combat-hud-types';
import { SkillSlot } from './SkillSlot';
import styles from './CombatHUD.module.css';

interface SkillBarProps {
  player: CombatHudState['player'];
}

export function SkillBar({ player }: SkillBarProps) {
  const dashReady = player.dashCooldown <= 0;
  const dashSeconds = Math.max(0, player.dashCooldown / 1000);
  const dashRatio =
    player.dashMaxCooldown > 0 ? Math.min(1, player.dashCooldown / player.dashMaxCooldown) : 0;
  const potionReady = player.potionCooldown <= 0 && player.potionCount > 0;
  const potionSeconds = Math.max(0, player.potionCooldown / 1000);
  const potionRatio =
    player.potionMaxCooldown > 0 ? Math.min(1, player.potionCooldown / player.potionMaxCooldown) : 0;

  return (
    <div className={styles.skills} aria-label="전투 조작">
      <div className={styles.slot}>
        <p className={styles.slotKey}>LMB</p>
        <div className={styles.icon} data-icon="slash" />
        <p className={styles.slotName}>Basic Attack</p>
      </div>
      <div className={`${styles.slot} ${dashReady ? '' : styles.slotDisabled}`}>
        <p className={styles.slotKey}>SPACE</p>
        <div className={styles.cooldown}>
          <div className={styles.icon} data-icon="dash" />
          {dashReady ? null : (
            <div className={styles.cooldownOverlay} style={{ opacity: 0.45 + dashRatio * 0.4 }}>
              {dashSeconds.toFixed(1)}
            </div>
          )}
        </div>
        <p className={styles.slotName}>{dashReady ? 'DASH Ready' : 'DASH'}</p>
      </div>
      <div className={`${styles.slot} ${potionReady ? '' : styles.slotDisabled}`}>
        <p className={styles.slotKey}>H</p>
        <div className={styles.cooldown}>
          <div className={styles.icon} data-icon="potion" />
          {potionReady ? null : (
            <div className={styles.cooldownOverlay} style={{ opacity: 0.45 + potionRatio * 0.4 }}>
              {player.potionCount <= 0 ? '0' : potionSeconds.toFixed(1)}
            </div>
          )}
        </div>
        <p className={styles.slotName}>{`Potion ${player.potionCount}`}</p>
      </div>
      {player.skills.map((slot) => (
        <SkillSlot currentMp={player.mp} key={slot.slot} slot={slot} />
      ))}
    </div>
  );
}
