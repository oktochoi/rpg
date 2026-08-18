import type { CombatHudState } from '@/game/combat/hud/combat-hud-types';
import styles from './CombatHUD.module.css';

interface PlayerStatusHUDProps {
  player: CombatHudState['player'];
}

export function PlayerStatusHUD({ player }: PlayerStatusHUDProps) {
  const hpRatio = player.maxHp <= 0 ? 0 : Math.max(0, Math.min(1, player.hp / player.maxHp));
  const mpRatio = player.maxMp <= 0 ? 0 : Math.max(0, Math.min(1, player.mp / player.maxMp));

  return (
    <section className={styles.player} aria-label="플레이어 상태">
      <p className={styles.className}>{player.className}</p>
      <div className={styles.barRow}>
        <span className={styles.barLabel}>HP</span>
        <div className={styles.barTrack}>
          <div className={`${styles.barFill} ${styles.hp}`} style={{ width: `${hpRatio * 100}%` }} />
        </div>
        <span className={styles.barValue}>
          {player.hp} / {player.maxHp}
        </span>
      </div>
      {player.maxMp > 0 ? (
        <div className={styles.barRow}>
          <span className={styles.barLabel}>MP</span>
          <div className={styles.barTrack}>
            <div className={`${styles.barFill} ${styles.mp}`} style={{ width: `${mpRatio * 100}%` }} />
          </div>
          <span className={styles.barValue}>
            {player.mp} / {player.maxMp}
          </span>
        </div>
      ) : null}
    </section>
  );
}
