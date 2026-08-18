import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type * as Phaser from 'phaser';
import { audioManager, bgmContextForCombat, SFX_ID } from '@/game/audio';
import { startBridgedCombat, subscribeCombatResult } from '@/game/combat/CombatBridge';
import { encounterTitle } from '@/game/combat/encounters/encounter-presentation';
import type { CombatConfig } from '@/game/combat/types/combat-config';
import type { CombatResult } from '@/game/combat/types/combat-result';
import { CombatHUD } from './CombatHUD';
import styles from './CombatView.module.css';

interface CombatViewProps {
  config: CombatConfig;
  onResult: (result: CombatResult) => void;
}

export function CombatView({ config, onResult }: CombatViewProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const resolvedRef = useRef(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(true);
  const title = encounterTitle(config.encounterId);

  useLayoutEffect(() => {
    resolvedRef.current = false;
    setFatalError(null);
    setShowTitle(true);
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.COMBAT_START);
    audioManager.playBgmContext(bgmContextForCombat(config.encounterId));
    const hideTitle = window.setTimeout(() => setShowTitle(false), 900);

    if (gameRef.current === null) {
      try {
        gameRef.current = startBridgedCombat('combat-container', config);
      } catch {
        setFatalError('전투를 시작할 수 없습니다.');
      }
    }

    return () => {
      window.clearTimeout(hideTitle);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [config.combatId]);

  useEffect(() => {
    return subscribeCombatResult((result) => {
      if (resolvedRef.current || result.combatId !== config.combatId) {
        return;
      }
      resolvedRef.current = true;
      onResult(result);
    });
  }, [config.combatId, onResult]);

  const returnToStory = () => {
    if (resolvedRef.current) {
      return;
    }
    resolvedRef.current = true;
    onResult({
      combatId: config.combatId,
      outcome: 'DEFEAT',
      player: {
        remainingHp: config.player.currentHp,
        remainingMp: config.player.currentMp,
      },
      defeatedEnemyIds: [],
      defeatedEnemyTypes: [],
    });
  };

  return (
    <div className={styles.overlay}>
      <div id="combat-container" className={styles.canvas} />
      <div className={`${styles.fade} ${showTitle ? styles.fadeOn : ''}`} />
      {showTitle ? <p className={styles.encounterTitle}>{title}</p> : null}
      <div className={styles.hudLayer}>
        <CombatHUD />
      </div>
      {fatalError ? (
        <div className={styles.error}>
          <p>{fatalError}</p>
          <button type="button" onClick={returnToStory}>
            스토리로 돌아가기
          </button>
        </div>
      ) : null}
    </div>
  );
}
