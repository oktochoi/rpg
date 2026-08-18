import type { GameState } from '../core/game-state';
import type { PersistedGameState } from './save-types';

export function toPersistedGameState(state: Readonly<GameState>, playTimeSeconds: number): PersistedGameState {
  return {
    meta: { playTimeSeconds },
    mode: state.mode === 'COMBAT' || state.mode === 'RESOLVING' ? 'STORY' : state.mode,
    activeCombatId: null,
    pendingFreeActionTurnId: null,
    lastActionResolution: state.lastActionResolution,
    processedRelationshipSourceIds: state.processedRelationshipSourceIds,
    processedMemorySourceIds: state.processedMemorySourceIds,
    processedExpSourceIds: state.processedExpSourceIds ?? [],
    processedTurnRewardIds: state.processedTurnRewardIds ?? [],
    processedRewardIds: state.processedRewardIds ?? [],
    actionRepeatCounts: state.actionRepeatCounts ?? {},
    player: state.player,
    world: state.world,
    npcs: state.npcs,
    relationships: state.relationships,
    quests: state.quests,
    knowledge: state.knowledge,
    npcMemories: state.npcMemories,
    story: state.story,
    history: state.history ?? [],
  };
}

export function toGameState(persisted: PersistedGameState): GameState {
  const mode = persisted.mode === 'COMBAT' || persisted.mode === 'RESOLVING' ? 'STORY' : persisted.mode;
  return {
    mode,
    activeCombatId: null,
    pendingFreeActionTurnId: null,
    lastActionResolution: persisted.lastActionResolution,
    lastTurnSummary: null,
    lastEconomyNotice: null,
    processedRelationshipSourceIds: persisted.processedRelationshipSourceIds,
    processedMemorySourceIds: persisted.processedMemorySourceIds,
    processedExpSourceIds: persisted.processedExpSourceIds ?? [],
    processedTurnRewardIds: persisted.processedTurnRewardIds ?? [],
    processedRewardIds: persisted.processedRewardIds ?? [],
    actionRepeatCounts: persisted.actionRepeatCounts ?? {},
    player: persisted.player,
    knowledge: persisted.knowledge,
    npcs: persisted.npcs,
    relationships: persisted.relationships,
    npcMemories: persisted.npcMemories,
    story: persisted.story,
    world: persisted.world,
    quests: persisted.quests,
    history: persisted.history ?? [],
    activeMenu: null,
    saveNotice: null,
  };
}
