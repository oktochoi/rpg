import type { PlayerPanelView } from '@/components/story/types';
import styles from './hud.module.css';

interface PlayerPanelProps {
  player: PlayerPanelView;
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

export function PlayerPanel({ player }: PlayerPanelProps) {
  return (
    <aside className={styles.player} aria-label="플레이어 정보">
      <div className={styles.identity}>
        <h2 className={styles.name}>{player.name}</h2>
        <p className={styles.job}>
          {player.job} / Level {player.level}
        </p>
      </div>
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
