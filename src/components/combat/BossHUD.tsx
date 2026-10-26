import type { CombatHudState } from '@/game/combat/hud/combat-hud-types';
import { isCombatDebugEnabled } from '@/game/debug/debug-flags';
import styles from './CombatHUD.module.css';

interface BossHUDProps {
  boss: NonNullable<CombatHudState['boss']>;
}

export function BossHUD({ boss }: BossHUDProps) {
  const ratio = boss.maxHp <= 0 ? 0 : Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  const percent = Math.round(ratio * 100);

  return (
    <section className={styles.boss} aria-label="보스 상태">
      <p className={styles.bossName}>{boss.name}</p>
      {isCombatDebugEnabled() ? <p className={styles.bossPhase}>PHASE {boss.phase}</p> : null}
      <div
        className={styles.bossMeter}
        role="meter"
        aria-label="보스 HP"
        aria-valuemin={0}
        aria-valuemax={boss.maxHp}
        aria-valuenow={Math.round(boss.hp)}
      >
        <div className={styles.bossMeterFill} style={{ width: `${percent}%` }} />
        <span className={styles.bossMeterValue}>
          {Math.round(boss.hp)} / {boss.maxHp}
        </span>
      </div>
    </section>
  );
}
