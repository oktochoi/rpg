import { useEffect } from 'react';
import type { NpcDialogueResponse } from '@/ai/types';
import type { CommandDispatcher } from '@/game/core/command';
import type { GameState } from '@/game/core/game-state';
import type { NpcId } from '@/game/core/ids';
import {
  doesNpcKnowFact,
  doesPlayerKnowFact,
  getKnownFactsForNpc,
} from '@/game/knowledge/knowledge-selectors';
import { formatNpcMemoriesDebug, getMemoriesForNpc } from '@/game/npc/memory/memory-selectors';
import { debugSceneResolution } from '@/game/story/story-scene-resolver';
import { getAvailableChoices } from '@/game/story/story-choice-service';
import type { DirectorDebugSnapshot } from '@/ai/director';
import type { AiDebugSnapshot } from '@/ai/debug/ai-debug';
import type { WorldFact } from '@/game/world/facts/world-fact';
import styles from './KnowledgeDebugPanel.module.css';

interface KnowledgeDebugPanelProps {
  state: GameState;
  dispatch: CommandDispatcher;
  lastDialogue?: NpcDialogueResponse | null;
  directorDebug?: DirectorDebugSnapshot | null;
  aiDebug?: AiDebugSnapshot | null;
}

const DEBUG_NPCS: readonly { id: NpcId; label: string }[] = [
  { id: 'seria', label: '세리아' },
  { id: 'leon', label: '레온' },
  { id: 'innkeeper', label: '마르타' },
];

function describeFact(fact: WorldFact): string {
  if (fact.type === 'ENEMY_DEFEATED') {
    return 'Goblin defeated';
  }
  if (fact.type === 'COMBAT_WON') {
    return 'Combat won';
  }
  if (fact.type === 'COMBAT_LOST') {
    return 'Combat lost';
  }
  return fact.type;
}

function mark(known: boolean): string {
  return known ? '✅' : '❌';
}

export function KnowledgeDebugPanel({ state, dispatch, lastDialogue, directorDebug, aiDebug }: KnowledgeDebugPanelProps) {
  const goblinFact =
    state.world.facts.find((fact) => fact.type === 'ENEMY_DEFEATED') ??
    state.world.facts.find((fact) => fact.type === 'COMBAT_WON');
  const seriaFacts = getKnownFactsForNpc(state, 'seria');
  const shareFact = goblinFact ?? seriaFacts[0];
  const canShare = Boolean(
    shareFact && doesNpcKnowFact(state, 'seria', shareFact.id) && !doesNpcKnowFact(state, 'leon', shareFact.id)
  );
  const currentNpcId = state.story.currentNpcId ?? 'seria';
  const seriaTrust = state.relationships.seria?.trust ?? 0;
  const sceneDebug = debugSceneResolution(state);
  const availableChoices = getAvailableChoices(state);

  useEffect(() => {
    const lines = DEBUG_NPCS.map((npc) => {
      const known = goblinFact ? doesNpcKnowFact(state, npc.id, goblinFact.id) : false;
      return `${state.npcs[npc.id]?.name ?? npc.label} - ${goblinFact ? describeFact(goblinFact) : 'Goblin defeated'} ${mark(known)}`;
    });
    console.info(
      ['=== KNOWLEDGE DEBUG ===', `Player - Goblin defeated ${mark(Boolean(goblinFact && doesPlayerKnowFact(state, goblinFact.id)))}`, ...lines].join('\n')
    );
    console.info(DEBUG_NPCS.map((npc) => formatNpcMemoriesDebug(state, npc.id)).join('\n\n'));
    console.info(
      [
        '=== STORY SCENE DEBUG ===',
        `sceneId: ${state.story.currentSceneId}`,
        `location: ${state.world.currentLocationId}`,
        `available: ${sceneDebug.availableSceneIds.join(', ') || '(none)'}`,
        `choices: ${availableChoices.map((choice) => choice.id).join(', ')}`,
        `rejected: ${sceneDebug.rejected.map((item) => `${item.sceneId}:${item.reason}`).join(', ') || '(none)'}`,
      ].join('\n')
    );
  }, [state, goblinFact, sceneDebug, availableChoices]);

  return (
    <aside className={styles.panel} aria-label="Knowledge Debug">
      <p className={styles.title}>=== AI DEBUG ===</p>
      <p className={styles.meta}>mode: {(aiDebug?.mode ?? 'mock').toUpperCase()}</p>
      <p className={styles.meta}>provider: {aiDebug?.provider ?? 'mock'}</p>
      <p className={styles.meta}>model: {aiDebug?.model ?? 'none'}</p>
      <p className={styles.meta}>last: {aiDebug?.lastRequestType ?? '(none)'}</p>
      <p className={styles.meta}>latency: {aiDebug?.latencyMs != null ? `${aiDebug.latencyMs}ms` : '-'}</p>
      <p className={styles.meta}>
        result: {aiDebug?.success == null ? '-' : aiDebug.success ? 'success' : 'failure'}
        {aiDebug?.fallbackUsed ? ' / fallback' : ''}
      </p>
      <p className={styles.meta}>schema: {aiDebug?.schemaValid == null ? '-' : aiDebug.schemaValid ? 'ok' : 'fail'}</p>
      <p className={styles.title}>=== DIRECTOR DEBUG ===</p>
      <p className={styles.meta}>turnId: {directorDebug?.turnId ?? state.world.turn}</p>
      <p className={styles.meta}>scene: {directorDebug?.currentSceneId ?? state.story.currentSceneId}</p>
      <p className={styles.meta}>candidates: {directorDebug?.candidateCount ?? 0}</p>
      <p className={styles.meta}>selected: {directorDebug?.selectedIds.join(', ') || '(none)'}</p>
      <p className={styles.meta}>
        excluded: {directorDebug?.excluded.map((item) => `${item.id}:${item.excludedReason}`).join(', ') || '(none)'}
      </p>
      <p className={styles.title}>=== STORY SCENE DEBUG ===</p>
      <p className={styles.meta}>sceneId: {state.story.currentSceneId}</p>
      <p className={styles.meta}>location: {state.world.currentLocationId}</p>
      <p className={styles.meta}>available: {sceneDebug.availableSceneIds.join(', ') || '(none)'}</p>
      <p className={styles.meta}>choices: {availableChoices.map((choice) => choice.id).join(', ')}</p>
      <p className={styles.meta}>
        rejected: {sceneDebug.rejected.map((item) => `${item.sceneId}:${item.reason}`).join(', ') || '(none)'}
      </p>
      <p className={styles.title}>=== KNOWLEDGE DEBUG ===</p>
      <p className={styles.meta}>current NPC: {state.npcs[currentNpcId]?.name ?? currentNpcId}</p>
      <div className={styles.row}>
        {DEBUG_NPCS.map((npc) => (
          <button
            className={styles.share}
            key={npc.id}
            type="button"
            onClick={() => dispatch({ type: 'START_DIALOGUE', npcId: npc.id })}
          >
            {npc.label}
          </button>
        ))}
      </div>
      <ul className={styles.list}>
        {DEBUG_NPCS.map((npc) => {
          const npcState = state.npcs[npc.id];
          const known = goblinFact ? doesNpcKnowFact(state, npc.id, goblinFact.id) : false;
          const entry = npcState?.knowledge.entries.find((item) => item.factId === goblinFact?.id);
          return (
            <li key={npc.id}>
              <strong>{npcState?.name ?? npc.label}</strong>
              <span>
                {' '}
                - Goblin defeated {mark(known)}
                {entry ? ` (${entry.sourceType}${entry.sourceId ? ` / ${entry.sourceId}` : ''}, ${entry.confidence})` : ''}
              </span>
            </li>
          );
        })}
        <li>
          <strong>Player</strong>
          <span> - Goblin defeated {mark(Boolean(goblinFact && doesPlayerKnowFact(state, goblinFact.id)))}</span>
        </li>
        <li>
          <strong>Seria trust</strong>
          <span> {seriaTrust}</span>
        </li>
      </ul>
      {DEBUG_NPCS.map((npc) => {
        const memories = getMemoriesForNpc(state, npc.id);
        return (
          <div key={`${npc.id}-memory`}>
            <p className={styles.title}>=== {npc.label.toUpperCase()} MEMORY ===</p>
            {memories.length === 0 ? (
              <p className={styles.meta}>(none)</p>
            ) : (
              <ul className={styles.list}>
                {memories.map((memory) => (
                  <li key={memory.id}>
                    [{memory.importance}] {memory.summary}
                    <span> {memory.emotionalTag ?? 'NEUTRAL'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <div className={styles.row}>
        <button
          className={styles.share}
          type="button"
          disabled={!canShare || !shareFact}
          onClick={() => {
            if (!shareFact) {
              return;
            }
            dispatch({
              type: 'SHARE_FACT',
              factId: shareFact.id,
              fromId: 'seria',
              toId: 'leon',
            });
          }}
        >
          세리아 → 레온 전달
        </button>
        <button
          className={styles.share}
          type="button"
          disabled={!shareFact}
          onClick={() => {
            if (!shareFact) {
              return;
            }
            for (const npc of DEBUG_NPCS) {
              dispatch({ type: 'GRANT_FACT', factId: shareFact.id, npcId: npc.id });
            }
          }}
        >
          세 NPC에게 사실 부여
        </button>
      </div>
      <div className={styles.row}>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: 70 })}
        >
          세리아 신뢰 +70
        </button>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: -50 })}
        >
          세리아 신뢰 -50
        </button>
      </div>
      <div className={styles.row}>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_PLAYER_GOLD', gold: 100 })}
        >
          골드 100
        </button>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_PLAYER_GOLD', gold: 0 })}
        >
          골드 0
        </button>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_PLAYER_CLASS', classId: 'warrior' })}
        >
          직업 전사
        </button>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_PLAYER_CLASS', classId: 'mage' })}
        >
          직업 마법사
        </button>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_PLAYER_CLASS', classId: 'rogue' })}
        >
          직업 도적
        </button>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'SET_PLAYER_CLASS', classId: 'wanderer' })}
        >
          직업 방랑자
        </button>
        <button
          className={styles.share}
          type="button"
          onClick={() => dispatch({ type: 'COMPLETE_QUEST', questId: 'ruins_mystery' })}
        >
          퀘스트 완료
        </button>
      </div>
      {lastDialogue ? (
        <p className={styles.meta}>
          last: {lastDialogue.emotion} · usedFactIds [{lastDialogue.usedFactIds.join(', ')}] · usedMemoryIds [{' '}
          {lastDialogue.usedMemoryIds.join(', ')}]
        </p>
      ) : null}
      {state.lastActionResolution ? (
        <p className={styles.meta}>
          action: {state.lastActionResolution.actionType} · {state.lastActionResolution.success ? 'ok' : 'fail'} · {state.lastActionResolution.nextMode}
        </p>
      ) : null}
      <p className={styles.meta}>
        turn {state.world.turn} · gold {state.player.gold} · job {state.player.classId} · facts {state.world.facts.length}
      </p>
    </aside>
  );
}
