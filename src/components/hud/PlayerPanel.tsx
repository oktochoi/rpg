import type { PlayerPanelView } from '@/components/story/types';
import styles from './hud.module.css';

interface PlayerPanelProps {
  player: PlayerPanelView;
  onOpenCharacter?: () => void;
}

function ResourceBar({
  label,
  current,
  max,
  fillClassName,
}: {
  label: string;
  current: number;
  max: number;
  fillClassName: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  return (
    <div className={styles.barBlock}>
      <div className={styles.barMeta}>
        <span>{label}</span>
        <span>
          {current} / {max}
        </span>
      </div>
      <div className={styles.track} aria-hidden="true">
        <div className={`${styles.fill} ${fillClassName}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function PlayerPanel({ player, onOpenCharacter }: PlayerPanelProps) {
  const expToNext = player.expToNext ?? 0;
  const expPercent = expToNext > 0 ? Math.min(100, Math.max(0, ((player.exp ?? 0) / expToNext) * 100)) : 100;

  return (
    <aside className={styles.player} aria-label="플레이어 정보">
      <button
        type="button"
        className={styles.identityButton}
        onClick={onOpenCharacter}
        aria-label="캐릭터 화면 열기"
      >
        <div className={styles.identity}>
          <h2 className={styles.name}>{player.name}</h2>
          <p className={styles.job}>
            Lv.{player.level} {player.job}
          </p>
          {expToNext ? (
            <div className={styles.barBlock}>
              <div className={styles.barMeta}>
                <span>EXP</span>
                <span>
                  {player.exp ?? 0} / {expToNext}
                </span>
              </div>
              <div className={styles.track} aria-hidden="true">
                <div className={`${styles.fill} ${styles.exp}`} style={{ width: `${expPercent}%` }} />
              </div>
            </div>
          ) : null}
          {player.nextRank ? (
            <p className={styles.job}>
              다음 전직: {player.nextRank}
              {player.nextRankHint ? ` (${player.nextRankHint})` : ''}
            </p>
          ) : null}
          <p className={styles.gold}>Gold {player.gold ?? 0} G</p>
        </div>
      </button>
      <div className={styles.bars}>
        <ResourceBar label="HP" current={player.hp} max={player.maxHp} fillClassName={styles.hp} />
        <ResourceBar label="MP" current={player.mp} max={player.maxMp} fillClassName={styles.mp} />
      </div>
      <div>
        <p className={styles.statsTitle}>주요 스탯</p>
        <dl className={styles.stats}>
          {player.stats.map((stat) => (
            <div className={styles.stat} key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
