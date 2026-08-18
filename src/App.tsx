import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { StoryScreen } from '@/components/story/StoryScreen';
import { TitleScreen } from '@/components/title/TitleScreen';
import { CharacterCreation } from '@/components/character-creation/CharacterCreation';
import { GameToast } from '@/components/feedback/GameToast';
import { useGameToasts } from '@/components/feedback/useGameToasts';
import { buildCombatConfig } from '@/game/combat/CombatBridge';
import type { CombatResult } from '@/game/combat/types/combat-result';
import type { Command } from '@/game/core/command';
import { createGameOrchestrator, type GameOrchestrator } from '@/game/core/orchestrator';
import { createInitialGameState } from '@/game/core/initial-state';
import type { GameState } from '@/game/core/game-state';
import { TEST_GOBLIN_COMBAT_ID } from '@/game/story/test-scenes';
import { ENCOUNTER_ID } from '@/game/combat/encounters/encounter-definitions';
import { toStoryScreenView } from '@/game/story/story-view';
import { getTalkPrompt } from '@/game/npc/talk-choices';
import { createNpcDialogueService } from '@/ai/service';
import type { NpcDialogueResponse, NpcDialogueService } from '@/ai/types';
import { createStoryDirector, generateStoryChoices, getLastDirectorDebug } from '@/ai/director';
import { choiceRefreshKey } from '@/game/story/choices';
import type { Choice } from '@/game/story/choice';
import type { DynamicChoice } from '@/game/story/choices/choice-types';
import { KnowledgeDebugPanel } from '@/components/debug/KnowledgeDebugPanel';
import { createLocalSaveService } from '@/game/save/save-service';
import type { SaveService } from '@/game/save/save-types';
import { readPublicAiMode } from '@/ai/config/ai-config';
import { getLastAiDebug, recordAiDebug, type AiDebugSnapshot } from '@/ai/debug/ai-debug';
import { audioManager, bgmContextForLocation } from '@/game/audio';
import { isDevelopmentBuild, isGameDebugEnabled, setGameDebugEnabled } from '@/game/debug/debug-flags';
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
  const [talking, setTalking] = useState(false);
  const [directorLoading, setDirectorLoading] = useState(false);
  const [lastDialogue, setLastDialogue] = useState<NpcDialogueResponse | null>(null);
  const [directorChoices, setDirectorChoices] = useState<Choice[]>([]);
  const [aiDebug, setAiDebug] = useState<AiDebugSnapshot>(getLastAiDebug);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const orchestratorRef = useRef<GameOrchestrator | null>(null);
  const dialogueServiceRef = useRef<NpcDialogueService | null>(null);
  const saveServiceRef = useRef<SaveService | null>(null);
  const directorRef = useRef(createStoryDirector());
  const toasts = useGameToasts(state);
  const inGame = appPhase === APP_PHASE.GAME;

  if (saveServiceRef.current === null) {
    saveServiceRef.current = createLocalSaveService();
  }
  if (orchestratorRef.current === null) {
    orchestratorRef.current = createGameOrchestrator(state, setState, { saveService: saveServiceRef.current });
  }
  if (dialogueServiceRef.current === null) {
    dialogueServiceRef.current = createNpcDialogueService(() => orchestratorRef.current!.getState());
  }

  const slots = saveServiceRef.current.listSlots();
  const canContinue = slots.some((slot) => !slot.empty);

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
    if (!inGame || state.mode === 'COMBAT') {
      return;
    }
    audioManager.playBgmContext(bgmContextForLocation(state.world.currentLocationId));
  }, [inGame, state.mode, state.world.currentLocationId]);

  useEffect(() => {
    recordAiDebug({ mode: readPublicAiMode(), provider: 'openai-compatible' });
    refreshDebug();
    void fetch('/api/ai')
      .then((response) => response.json())
      .then((status: { mode?: string; provider?: string; model?: string; configured?: boolean }) => {
        recordAiDebug({
          mode: status.configured ? 'real' : 'mock',
          provider: status.provider ?? 'openai-compatible',
          model: status.model ?? 'unknown',
        });
        refreshDebug();
      })
      .catch(() => {
        recordAiDebug({ mode: readPublicAiMode(), fallbackUsed: readPublicAiMode() === 'real', error: 'api_unavailable' });
        refreshDebug();
      });
  }, [refreshDebug]);

  useEffect(() => {
    if (!aiDebug.fallbackUsed || !aiDebug.requestId) {
      return;
    }
    setFallbackNotice(isGameDebugEnabled() ? 'GROQ FALLBACK' : '응답이 잠시 불안정합니다.');
    const hide = window.setTimeout(() => setFallbackNotice(null), 2400);
    return () => window.clearTimeout(hide);
  }, [aiDebug.fallbackUsed, aiDebug.requestId]);

  const dispatch = useCallback((command: Command) => {
    void orchestratorRef.current?.dispatch(command);
  }, []);

  const runNpcDialogue = useCallback(async (playerText: string) => {
    const orchestrator = orchestratorRef.current;
    const service = dialogueServiceRef.current;
    if (!orchestrator || !service) {
      return;
    }

    const npcId = orchestrator.getState().story.currentNpcId ?? 'seria';
    const turnId = orchestrator.getState().world.turn;
    setTalking(true);
    try {
      const response = await service.respond(npcId, playerText);
      if (orchestrator.getState().world.turn !== turnId) {
        return;
      }
      setLastDialogue(response);
      await orchestrator.dispatch({
        type: 'RECORD_DIALOGUE',
        npcId: response.npcId,
        playerText,
        npcText: response.dialogue,
        usedMemoryIds: response.usedMemoryIds,
      });
    } finally {
      setTalking(false);
      refreshDebug();
    }
  }, [refreshDebug]);

  const handleStoryCommand = useCallback(
    (command: Command) => {
      if (command.type === 'SELECT_CHOICE') {
        const prompt = getTalkPrompt(command.choiceId);
        if (prompt) {
          void runNpcDialogue(prompt);
          return;
        }
      }
      dispatch(command);
    },
    [dispatch, runNpcDialogue]
  );

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
      dispatch({ type: 'RESOLVE_COMBAT', result });
    },
    [dispatch]
  );

  const combatConfig = useMemo(() => {
    if (state.mode !== 'COMBAT' || state.activeCombatId === null) {
      return null;
    }
    return buildCombatConfig(state, state.activeCombatId);
  }, [state]);

  const refreshKey = choiceRefreshKey(state);

  useEffect(() => {
    const current = orchestratorRef.current?.getState();
    if (
      !inGame ||
      !current ||
      talking ||
      current.mode === 'COMBAT' ||
      current.mode === 'RESOLVING'
    ) {
      return;
    }
    const turnId = current.world.turn;
    let cancelled = false;
    setDirectorLoading(true);
    void generateStoryChoices(current, directorRef.current)
      .then((response) => {
        if (cancelled) {
          return;
        }
        const latest = orchestratorRef.current?.getState();
        if (!latest || response.turnId !== latest.world.turn || response.turnId !== turnId) {
          return;
        }
        setDirectorChoices(toViewChoices(response.choices));
      })
      .finally(() => {
        if (!cancelled) {
          setDirectorLoading(false);
          refreshDebug();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, talking, refreshDebug, inGame]);

  const latestSaveSlot = slots
    .filter((slot) => !slot.empty)
    .slice()
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0]?.slotId;

  const handleNewGame = () => {
    if (canContinue && typeof window !== 'undefined') {
      const ok = window.confirm('새 게임을 시작하면 현재 Autosave가 교체될 수 있습니다.');
      if (!ok) {
        return;
      }
    }
    setTitleSettings(false);
    setAppPhase(APP_PHASE.CHARACTER_CREATION);
  };

  const handleContinue = () => {
    if (!latestSaveSlot) {
      return;
    }
    dispatch({ type: 'LOAD_GAME', slotId: latestSaveSlot });
    setDirectorChoices([]);
    setLastDialogue(null);
    setAppPhase(APP_PHASE.GAME);
  };

  const handleCreateCharacter = (name: string) => {
    dispatch({ type: 'NEW_GAME', name });
    setDirectorChoices([]);
    setLastDialogue(null);
    setAppPhase(APP_PHASE.GAME);
  };

  const storyInputEnabled =
    inGame && state.mode !== 'COMBAT' && state.mode !== 'RESOLVING' && !talking && !directorLoading;
  const storyView = toStoryScreenView(state, directorChoices.length > 0 ? directorChoices : undefined, {
    npcEmotion: lastDialogue?.emotion ?? 'neutral',
  });
  const npcName = state.npcs[state.story.currentNpcId ?? 'seria']?.name ?? 'NPC';
  const statusMessage = talking
    ? `${npcName}가 잠시 생각한다...`
    : state.mode === 'RESOLVING'
      ? '행동을 해석하는 중...'
      : directorLoading
        ? '상황을 정리하는 중...'
        : null;

  return (
    <div id="app">
      {appPhase === APP_PHASE.TITLE ? (
        <TitleScreen
          canContinue={canContinue}
          settingsOpen={titleSettings}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onOpenSettings={() => setTitleSettings(true)}
          onCloseSettings={() => setTitleSettings(false)}
        />
      ) : appPhase === APP_PHASE.CHARACTER_CREATION ? (
        <CharacterCreation onBack={() => setAppPhase(APP_PHASE.TITLE)} onConfirm={handleCreateCharacter} />
      ) : state.mode === 'COMBAT' && combatConfig ? (
        <CombatView config={combatConfig} onResult={handleCombatResult} />
      ) : (
        <>
          <StoryScreen
            view={storyView}
            dispatch={handleStoryCommand}
            inputEnabled={storyInputEnabled}
            statusMessage={statusMessage}
            fallbackNotice={fallbackNotice}
            activeMenu={state.activeMenu}
            saveNotice={state.saveNotice}
            slots={slots}
            gameState={state}
          />
          <GameToast items={toasts} />
          {debugOn ? (
            <>
              <KnowledgeDebugPanel
                state={state}
                dispatch={dispatch}
                lastDialogue={lastDialogue}
                directorDebug={getLastDirectorDebug()}
                aiDebug={aiDebug}
              />
              <div className={styles.testRow}>
                <button className={styles.testButton} type="button" onClick={() => void startClassCombat('warrior')}>
                  검사 전투
                </button>
                <button className={styles.testButton} type="button" onClick={() => void startClassCombat('mage')}>
                  마법사 전투
                </button>
                <button className={styles.testButton} type="button" onClick={() => void startClassCombat('rogue')}>
                  도적 전투
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => dispatch({ type: 'START_COMBAT', combatId: TEST_GOBLIN_COMBAT_ID })}
                >
                  고블린 전투
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_ARCHER_01 })}
                >
                  궁수 전투
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BRUTE_01 })}
                >
                  브루트 전투
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_HEAVY_01 })}
                >
                  중혼합 전투
                </button>
                <button
                  className={styles.testButton}
                  type="button"
                  onClick={() => void startClassCombat('warrior', ENCOUNTER_ID.RUINS_BOSS_01)}
                >
                  보스 전투
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
      {isDevelopmentBuild() ? (
        <button
          className={styles.debugToggle}
          type="button"
          onClick={() => {
            const next = !debugOn;
            setGameDebugEnabled(next);
            setDebugOn(next);
          }}
        >
          DEBUG
        </button>
      ) : null}
    </div>
  );
}

function toViewChoices(choices: readonly DynamicChoice[]): Choice[] {
  return choices.map((choice) => ({
    id: choice.id,
    label: choice.text,
    source: choice.source,
    candidateId: choice.candidateId,
  }));
}

export default App;
