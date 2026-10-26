import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type * as Phaser from 'phaser';
import { audioManager } from '@/game/audio';
import { startBridgedCombat, subscribeCombatResult } from '@/game/combat/CombatBridge';
import { clearEncounterCue, subscribeEncounterCue, type EncounterCue } from '@/game/combat/encounters/encounter-cue-bridge';
import type { CombatConfig } from '@/game/combat/types/combat-config';
import type { CombatResult } from '@/game/combat/types/combat-result';
import { subscribeCombatHud } from '@/game/combat/hud/combat-hud-bridge';
import { requestCombatProceed } from '@/game/combat/hud/combat-outcome-bridge';
import type { CombatStatus } from '@/game/combat/combat-state';
import { CombatHUD } from './CombatHUD';
import styles from './CombatView.module.css';

interface CombatViewProps {
  config: CombatConfig;
  onResult: (result: CombatResult) => void;
  onGameOver?: () => void;
  /** First session: practice the controls, then start the story. */
  openingLesson?: boolean;
  onOpeningStart?: () => void;
}

export function CombatView({ config, onResult, onGameOver, openingLesson = false, onOpeningStart }: CombatViewProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const resolvedRef = useRef(false);
  const configRef = useRef(config);
  configRef.current = config;
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [hudReady, setHudReady] = useState(config.training === true);
  const [cue, setCue] = useState<EncounterCue | null>(null);
  const [combatStatus, setCombatStatus] = useState<CombatStatus>('RUNNING');

  useLayoutEffect(() => {
    resolvedRef.current = false;
    setFatalError(null);
    setCue(null);
    const practice = configRef.current.training === true;
    setHudReady(practice);
    setCombatStatus('RUNNING');
    audioManager.unlock();
    clearEncounterCue();

    const unsubscribe = subscribeEncounterCue((next) => {
      setCue(next);
      if (next.phase === 'ready' || next.phase === 'active') {
        setHudReady(true);
      }
    });

    const latest = configRef.current;
    if (gameRef.current === null) {
      try {
        gameRef.current = startBridgedCombat('combat-container', latest);
      } catch {
        setFatalError('전투를 시작할 수 없습니다.');
      }
    }

    return () => {
      unsubscribe();
      clearEncounterCue();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [config.combatId]);

  useEffect(() => {
    return subscribeCombatHud((snapshot) => {
      if (snapshot?.status) {
        setCombatStatus(snapshot.status);
      }
    });
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
      consumedItemIds: [],
    });
  };

  const endTraining = () => {
    if (resolvedRef.current || !config.training) {
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
      consumedItemIds: [],
    });
  };

  const gameOver = combatStatus === 'DEFEAT' && !config.training;
  const showLine = Boolean(cue && cue.line && cue.phase !== 'active' && !config.training);
  const bossName = Boolean(showLine && cue?.boss && (cue.phase === 'entrance' || cue.phase === 'ready'));
  const bossDark = Boolean(cue?.boss && (cue.phase === 'pre' || cue.phase === 'entrance'));

  return (
    <div className={styles.overlay}>
      <div id="combat-container" className={styles.canvas} />
      <div className={`${styles.fade} ${bossDark ? styles.fadeOn : ''}`} />
      {showLine ? (
        <div className={`${styles.intro} ${bossName ? styles.introBoss : styles.introSkirmish}`} role="status" aria-live="polite">
          {bossName ? (
            <div className={styles.introBanner}>
              <p className={styles.introLine}>{cue?.line}</p>
            </div>
          ) : (
            <p className={styles.introCaption}>{cue?.line}</p>
          )}
        </div>
      ) : null}
      <div className={`${styles.hudLayer} ${hudReady && !gameOver ? '' : styles.hudHidden}`}>
        <CombatHUD />
      </div>
      {gameOver ? (
        <div className={styles.gameOver} role="dialog" aria-label="게임 오버">
          <div className={styles.gameOverCard}>
            <h1 className={styles.gameOverTitle}>게임 오버</h1>
            <p className={styles.gameOverLine}>쓰러졌다. 이 모험은 여기서 끝난다.</p>
            <button type="button" className={styles.resultButton} onClick={() => onGameOver?.()}>
              새 게임
            </button>
          </div>
        </div>
      ) : null}
      {combatStatus === 'VICTORY' ? (
        <div className={`${styles.resultPanel} ${styles.resultPanelRaised}`} role="group" aria-label="전투 승리">
          <button type="button" className={styles.resultButton} onClick={() => requestCombatProceed()}>
            돌아가기
          </button>
        </div>
      ) : null}
      {config.training && hudReady && openingLesson ? (
        <section className={styles.lesson} aria-label="전투 조작">
          <p className={styles.lessonKicker}>조작</p>
          <h2 className={styles.lessonTitle}>전투 조작</h2>
          <p className={styles.lessonBody}>{'이동  WASD\n공격  좌클릭\n회피  Space\n스킬  Q'}</p>
          <button type="button" className={styles.lessonStart} onClick={() => onOpeningStart?.()}>
            게임 시작하기
          </button>
        </section>
      ) : null}
      {config.training && hudReady && !openingLesson ? (
        <button type="button" className={styles.exitTraining} onClick={endTraining}>
          훈련 종료
        </button>
      ) : null}
      {fatalError ? (
        <div className={styles.error}>
          <p>{fatalError}</p>
          <button type="button" className={styles.errorButton} onClick={returnToStory}>
            스토리로 돌아가기
          </button>
        </div>
      ) : null}
    </div>
  );
}
