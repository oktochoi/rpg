import type { CombatHudState } from '@/game/combat/hud/combat-hud-types';
import styles from './CombatHUD.module.css';

interface BossHUDProps {
  boss: NonNullable<CombatHudState['boss']>;
}

export function BossHUD({ boss }: BossHUDProps) {
  const ratio = boss.maxHp <= 0 ? 0 : Math.max(0, Math.min(1, boss.hp / boss.maxHp));

  return (
    <section className={styles.boss} aria-label="보스 상태">
      <p className={styles.bossRule}>════════════════════════════</p>
      <p className={styles.bossName}>{boss.name}</p>
      <p className={styles.bossSub}>RUINS GUARDIAN</p>
      <div className={styles.bossTrack}>
        <div className={styles.bossFill} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className={styles.bossPhase}>PHASE {boss.phase}</p>
      <p className={styles.bossRule}>════════════════════════════</p>
    </section>
  );
}
