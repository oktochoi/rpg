import type { PlayerPanelView } from '@/components/story/types';
import styles from './hud.module.css';

interface PlayerPanelProps {
  player: PlayerPanelView;
  onOpenCharacter?: () => void;
  variant?: 'strip' | 'scene';
}

function ResourceBar({
  label,
  current,
  max,
  kind,
}: {
  label: string;
  current: number;
  max: number;
  kind: 'hp' | 'mp';
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;

  return (
    <div className={styles.barBlock}>
      <p className={styles.barMeta}>
        {label} {current} / {max}
      </p>
      <div className={styles.meter} role="meter" aria-label={label} aria-valuenow={current} aria-valuemin={0} aria-valuemax={max}>
        <div className={kind === 'hp' ? styles.meterHp : styles.meterMp} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export function PlayerPanel({ player, onOpenCharacter, variant = 'strip' }: PlayerPanelProps) {
  const onScene = variant === 'scene';
  return (
    <aside className={onScene ? styles.playerScene : styles.player} aria-label="플레이어 정보">
      <button
        type="button"
        className={onScene ? styles.identityScene : styles.identityButton}
        onClick={onOpenCharacter}
        aria-label="캐릭터 화면 열기"
      >
        <p className={styles.job}>Lv.{player.level}</p>
        <div className={styles.bars}>
          <ResourceBar label="HP" current={player.hp} max={player.maxHp} kind="hp" />
          <ResourceBar label="MP" current={player.mp} max={player.maxMp} kind="mp" />
        </div>
      </button>
    </aside>
  );
}
