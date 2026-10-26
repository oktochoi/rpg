import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { StoryScreen } from '@/components/story/StoryScreen';
import { TitleScreen } from '@/components/title/TitleScreen';
import { CharacterCreation } from '@/components/character-creation/CharacterCreation';
import { GameToast } from '@/components/feedback/GameToast';
import { useGameToasts } from '@/components/feedback/useGameToasts';
import { ActionTransitionOverlay } from '@/components/feel/ActionTransitionOverlay';
import { buildCombatConfig } from '@/game/combat/CombatBridge';
import type { CombatResult } from '@/game/combat/types/combat-result';
import type { Command } from '@/game/core/command';
import { createGameOrchestrator, type GameOrchestrator } from '@/game/core/orchestrator';
import { createInitialGameState } from '@/game/core/initial-state';
import type { GameState } from '@/game/core/game-state';
import { TEST_GOBLIN_COMBAT_ID } from '@/game/story/test-scenes';
import { ENCOUNTER_ID } from '@/game/combat/encounters/encounter-definitions';
import {
  resolveActionTransition,
  shouldStageCommand,
  type ActionTransitionSpec,
} from '@/game/feel/action-transition';
import { toStoryScreenView } from '@/game/story/story-view';
import { getAvailableChoices } from '@/game/story/story-choice-service';
import { KnowledgeDebugPanel } from '@/components/debug/KnowledgeDebugPanel';
import { createLocalSaveService } from '@/game/save/save-service';
import type { SaveService } from '@/game/save/save-types';
import { getLastAiDebug, type AiDebugSnapshot } from '@/ai/debug/ai-debug';
import { audioManager, BGM_CONTEXT, bgmContextForLocation } from '@/game/audio';
import { selectInteractionState, interactionStatusMessage } from '@/game/story/interaction-state';
import { isGameDebugEnabled } from '@/game/debug/debug-flags';
import { isTrainingCombatId } from '@/game/combat/training/training-combat';
import { LOCATION_ID } from '@/game/world/locations/location-definitions';
import { type PlayerClassId } from '@/game/player/classes';
import { APP_PHASE, type AppPhase } from '@/game/app-flow';
import styles from './App.module.css';

const CombatView = dynamic(
  () => import('@/components/combat/CombatView').then((module) => module.CombatView),
  { ssr: false }
);

function App() {
  const [state, setState] = useState<GameState>(createInitialGameState);
  const [appPhase, setAppPhase] = useState<AppPhase>(APP_PHASE.TITLE);
  const [titleSettings, setTitleSettings] = useState(false);
  const [debugOn, setDebugOn] = useState(false);
  const [interactionTick, setInteractionTick] = useState(0);
  const [aiDebug, setAiDebug] = useState<AiDebugSnapshot>(getLastAiDebug);
  const [openingLesson, setOpeningLesson] = useState(false);
  const [lessonHandoff, setLessonHandoff] = useState(false);
  const combatHoldRef = useRef<ReturnType<typeof buildCombatConfig> | null>(null);
  const lessonLeavingRef = useRef(false);
  const [transitionSpec, setTransitionSpec] = useState<ActionTransitionSpec | null>(null);
  const transitionLockRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const orchestratorRef = useRef<GameOrchestrator | null>(null);
  const saveServiceRef = useRef<SaveService | null>(null);
  const toasts = useGameToasts(state);
  const inGame = appPhase === APP_PHASE.GAME;
  const isTransitioning = transitionSpec !== null;

  if (saveServiceRef.current === null) {
    saveServiceRef.current = createLocalSaveService();
  }
  if (orchestratorRef.current === null) {
    orchestratorRef.current = createGameOrchestrator(state, setState, {
      saveService: saveServiceRef.current,
      autosaveEnabled: false,
    });
  }

  const refreshDebug = useCallback(() => {
    setAiDebug(getLastAiDebug());
  }, []);

  useEffect(() => {
    setDebugOn(isGameDebugEnabled());
  }, []);

  useEffect(() => {
    const unlock = () => audioManager.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      audioManager.stopBgm(300);
    };
  }, []);

  useEffect(() => {
    if (inGame && state.mode === 'COMBAT') {
      return;
    }
    const context = inGame ? bgmContextForLocation(state.world.currentLocationId) : BGM_CONTEXT.STORY_SAFE;
    audioManager.playBgmContext(context);
  }, [inGame, state.mode, state.world.currentLocationId]);

  useEffect(() => {
    if (!debugOn) {
      return;
    }
    refreshDebug();
  }, [debugOn, refreshDebug, state.world.turn, state.story.currentSceneId]);

  const dispatchImmediate = useCallback((command: Command) => {
    void orchestratorRef.current?.dispatch(command).then(() => {
      setInteractionTick((tick) => tick + 1);
    });
  }, []);

  const dispatch = useCallback(
    (command: Command) => {
      if (transitionLockRef.current) {
        return;
      }
      const orchestrator = orchestratorRef.current;
      if (!orchestrator) {
        return;
      }

      const stage = shouldStageCommand(command);
      const spec = stage ? resolveActionTransition(state, command) : null;
      if (!spec || spec.kind === 'none' || spec.durationMs <= 0) {
        void orchestrator.dispatch(command).then(() => {
          setInteractionTick((tick) => tick + 1);
        });
        return;
      }

      transitionLockRef.current = true;
      setTransitionSpec(spec);
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = window.setTimeout(() => {
        void orchestrator
          .dispatch(command)
          .catch(() => undefined)
          .finally(() => {
            transitionLockRef.current = false;
            setTransitionSpec(null);
            transitionTimerRef.current = null;
            setInteractionTick((tick) => tick + 1);
          });
      }, spec.durationMs);
    },
    [state]
  );

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const startClassCombat = useCallback(
    async (classId: PlayerClassId, combatId: string = ENCOUNTER_ID.RUINS_MIXED_01) => {
      const orchestrator = orchestratorRef.current;
      if (!orchestrator) {
        return;
      }
      await orchestrator.dispatch({ type: 'SET_PLAYER_CLASS', classId });
      await orchestrator.dispatch({ type: 'START_COMBAT', combatId });
    },
    []
  );

  const handleCombatResult = useCallback(
    (result: CombatResult) => {
      dispatchImmediate({ type: 'RESOLVE_COMBAT', result });
    },
    [dispatchImmediate]
  );

  const combatConfig = useMemo(() => {
    if (state.mode !== 'COMBAT' || state.activeCombatId === null) {
      return null;
    }
    return buildCombatConfig(state, state.activeCombatId);
  }, [state]);
  if (combatConfig) {
    combatHoldRef.current = combatConfig;
  }
  const shownCombat =
    state.mode === 'COMBAT' && combatConfig ? combatConfig : lessonHandoff ? combatHoldRef.current : null;

  const authoredChoices = useMemo(() => [...getAvailableChoices(state)], [state]);
  const refreshKey = `${state.world.turn}:${state.story.currentSceneId}:${state.story.flowMode ?? ''}`;

  const handleNewGame = () => {
    lessonLeavingRef.current = false;
    setOpeningLesson(false);
    setLessonHandoff(false);
    setTitleSettings(false);
    setAppPhase(APP_PHASE.CHARACTER_CREATION);
  };

  const handleCreateCharacter = (name: string) => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) {
      return;
    }
    lessonLeavingRef.current = false;
    void (async () => {
      await orchestrator.dispatch({ type: 'NEW_GAME', name });
      await orchestrator.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_TRAINING_GROUND });
      await orchestrator.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.TRAINING_GROUNDS });
      const started = orchestrator.getState();
      setOpeningLesson(started.mode === 'COMBAT' && isTrainingCombatId(started.activeCombatId));
      setAppPhase(APP_PHASE.GAME);
    })();
  };

  const finishOpeningLesson = () => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator || lessonLeavingRef.current) {
      return;
    }
    lessonLeavingRef.current = true;
    setLessonHandoff(true);
    const current = orchestrator.getState();
    void (async () => {
      if (current.mode === 'COMBAT' && current.activeCombatId) {
        await orchestrator.dispatch({
          type: 'RESOLVE_COMBAT',
          result: {
            combatId: current.activeCombatId,
            outcome: 'DEFEAT',
            player: {
              remainingHp: current.player.currentHp,
              remainingMp: current.player.currentMp,
            },
            defeatedEnemyIds: [],
            defeatedEnemyTypes: [],
            consumedItemIds: [],
          },
        });
      }
      await orchestrator.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
      setOpeningLesson(false);
      setLessonHandoff(false);
      setInteractionTick((tick) => tick + 1);
    })();
  };

  const interaction = selectInteractionState(state, {
    inGame,
    talking: false,
    directorLoading: false,
    candidateCount: authoredChoices.length,
  });
  const storyInputEnabled = interaction.canInteract && !isTransitioning;
  const storyView = toStoryScreenView(state, authoredChoices);
  const npcName = state.npcs[state.story.currentNpcId ?? 'seria']?.name ?? 'NPC';
  const statusMessage = interactionStatusMessage(state, { talking: false, directorLoading: false, npcName });

  return (
    <div id="app">
      {transitionSpec ? <ActionTransitionOverlay spec={transitionSpec} /> : null}
      {appPhase === APP_PHASE.TITLE ? (
        <TitleScreen
          settingsOpen={titleSettings}
          onNewGame={handleNewGame}
          onOpenSettings={() => setTitleSettings(true)}
          onCloseSettings={() => setTitleSettings(false)}
        />
      ) : appPhase === APP_PHASE.CHARACTER_CREATION ? (
        <CharacterCreation onBack={() => setAppPhase(APP_PHASE.TITLE)} onConfirm={handleCreateCharacter} />
      ) : shownCombat ? (
        <CombatView
          config={shownCombat}
          onResult={handleCombatResult}
          onGameOver={handleNewGame}
          openingLesson={openingLesson}
          onOpeningStart={finishOpeningLesson}
        />
      ) : (
        <>
          <StoryScreen
            view={storyView}
            dispatch={dispatch}
            inputEnabled={storyInputEnabled}
            statusMessage={statusMessage}
            fallbackNotice={null}
            lockToken={`${interactionTick}:${refreshKey}`}
            debugReason={isGameDebugEnabled() ? interaction.reason : null}
            activeMenu={state.activeMenu}
            saveNotice={state.saveNotice}
            gameState={state}
          />
          <GameToast items={toasts} />
          {debugOn ? (
            <>
              <KnowledgeDebugPanel
                state={state}
                dispatch={dispatch}
                lastDialogue={null}
                directorDebug={null}
                aiDebug={aiDebug}
              />
              <div className={styles.testRow}>
                <button className={styles.testButton} type="button" onClick={() => void startClassCombat('warrior')}>
                  검사
                </button>
                <button className={styles.testButton} type="button" onClick={() => void startClassCombat('mage')}>
                  마법사
                </button>
                <button className={styles.testButton} type="button" onClick={() => void startClassCombat('rogue')}>
                  도적
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => dispatch({ type: 'START_COMBAT', combatId: TEST_GOBLIN_COMBAT_ID })}
                >
                  고블린
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.RUINS_ARCHER_01)}
                >
                  궁수
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.RUINS_MAGE_01)}
                >
                  고블린 메이지
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.RUINS_BRUTE_01)}
                >
                  스톤 골렘
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.CH1_FOREST_SCOUTS)}
                >
                  숲 정찰
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.CH1_GOBLIN_CAMP)}
                >
                  야영지
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.FOREST_WOLF_01)}
                >
                  다이어 울프
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.RUINS_MIXED_01)}
                >
                  혼합
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.RUINS_BOSS_01)}
                >
                  유적 수호자
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

export default App;
