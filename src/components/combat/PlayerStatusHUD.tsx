import type { CombatHudState } from '@/game/combat/hud/combat-hud-types';
import { KitBar } from '@/components/ui/KitBar';
import styles from './CombatHUD.module.css';

interface PlayerStatusHUDProps {
  player: CombatHudState['player'];
}

export function PlayerStatusHUD({ player }: PlayerStatusHUDProps) {
  const hpRatio = player.maxHp <= 0 ? 0 : Math.max(0, Math.min(1, player.hp / player.maxHp));
  const mpRatio = player.maxMp <= 0 ? 0 : Math.max(0, Math.min(1, player.mp / player.maxMp));

  return (
    <section className={styles.player} aria-label="플레이어 상태">
      <img className={styles.portrait} src="/assets/characters/hero_swordsman/hero_portrait.png" alt="" />
      <div className={styles.playerBody}>
        <p className={styles.className}>{player.className}</p>
        <div className={styles.barRow}>
          <span className={styles.barLabel}>HP</span>
          <span className={styles.barValue}>
            {player.hp} / {player.maxHp}
          </span>
          <KitBar kind="hp" ratio={hpRatio} label="HP" />
        </div>
        {player.maxMp > 0 ? (
          <div className={styles.barRow}>
            <span className={styles.barLabel}>MP</span>
            <span className={styles.barValue}>
              {player.mp} / {player.maxMp}
            </span>
            <KitBar kind="mp" ratio={mpRatio} label="MP" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
