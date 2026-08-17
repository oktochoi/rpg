import { useLayoutEffect, useRef } from 'react';
import { startCombatGame } from '@/game/combat/CombatGame';
import styles from './CombatView.module.css';

interface CombatViewProps {
  onClose?: () => void;
}

export function CombatView({ onClose }: CombatViewProps) {
  const gameRef = useRef<Phaser.Game | null>(null);

  useLayoutEffect(() => {
    if (gameRef.current === null) {
      gameRef.current = startCombatGame('combat-container');
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className={styles.overlay}>
      {onClose ? (
        <button className={styles.close} type="button" onClick={onClose}>
          닫기
        </button>
      ) : null}
      <div id="combat-container" className={styles.canvas} />
    </div>
  );
}
