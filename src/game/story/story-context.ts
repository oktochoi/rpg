import type { GameState } from '../core/game-state';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../npc/memory/memory-selectors';
import { featuredQuest } from '../quests/quest-selectors';
import { getCurrentLocationNpcs } from '../world/locations/location-selectors';
import { getAvailableChoiceDefinitions } from './story-choice-service';
import { RUINS_SEAL_FACT_ID } from '../quests/quest-definitions';

export interface StoryContext {
  currentSceneId: string;
  currentLocation: string;
  currentNpcIds: readonly string[];
  relevantQuestStates: readonly { questId: string; status: string }[];
  playerClass: string;
  relevantPlayerKnownFacts: readonly string[];
  relevantNpcKnownFacts: readonly { npcId: string; factId: string }[];
  relevantRelationships: readonly { npcId: string; trust: number; fear: number; respect: number; affection: number }[];
  relevantMemories: readonly { npcId: string; type: string; summary: string }[];
  availableActionTypes: readonly string[];
}

export function buildStoryContext(state: Readonly<GameState>): StoryContext {
  const npcs = getCurrentLocationNpcs(state);
  const npcIds = npcs.map((npc) => npc.id);
  const quest = featuredQuest(state);
  const factIds = [RUINS_SEAL_FACT_ID].filter((factId) => doesPlayerKnowFact(state, factId));
  const npcFacts: { npcId: string; factId: string }[] = [];
  for (const npc of npcs) {
    if (doesNpcKnowFact(state, npc.id, RUINS_SEAL_FACT_ID)) {
      npcFacts.push({ npcId: npc.id, factId: RUINS_SEAL_FACT_ID });
    }
  }
  const relationships = npcIds.map((npcId) => {
    const value = state.relationships[npcId];
    return {
      npcId,
      trust: value?.trust ?? 0,
      fear: value?.fear ?? 0,
      respect: value?.respect ?? 0,
      affection: value?.affection ?? 0,
    };
  });
  const memories = npcIds.flatMap((npcId) =>
    getMemoriesForNpc(state, npcId)
      .slice(0, 3)
      .map((memory) => ({ npcId, type: memory.type, summary: memory.summary }))
  );
  const availableActionTypes = [
    ...new Set(getAvailableChoiceDefinitions(state).map((choice) => choice.action.type)),
  ];

  return {
    currentSceneId: state.story.currentSceneId,
    currentLocation: state.world.currentLocationId,
    currentNpcIds: npcIds,
    relevantQuestStates: quest ? [{ questId: quest.id, status: quest.status }] : [],
    playerClass: state.player.classId,
    relevantPlayerKnownFacts: factIds,
    relevantNpcKnownFacts: npcFacts,
    relevantRelationships: relationships,
    relevantMemories: memories,
    availableActionTypes,
  };
}

export function storyContextForScene(state: Readonly<GameState>): StoryContext {
  return buildStoryContext(state);
}
