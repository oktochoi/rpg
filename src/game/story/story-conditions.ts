import type { GameState } from '../core/game-state';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../npc/memory/memory-selectors';
import { isNpcAtCurrentLocation } from '../world/locations/location-selectors';
import type { StoryCondition, StoryConditionAtom } from './story-scene-types';

export function evaluateStoryCondition(state: Readonly<GameState>, condition: StoryCondition | undefined): boolean {
  if (!condition) {
    return true;
  }
  if ('allOf' in condition) {
    return condition.allOf.every((item) => evaluateStoryCondition(state, item));
  }
  if ('anyOf' in condition) {
    return condition.anyOf.some((item) => evaluateStoryCondition(state, item));
  }
  if ('noneOf' in condition) {
    return condition.noneOf.every((item) => !evaluateStoryCondition(state, item));
  }
  return evaluateAtom(state, condition);
}

function visitedSceneIds(state: Readonly<GameState>): readonly string[] {
  return state.story.visitedSceneIds ?? [];
}

function evaluateAtom(state: Readonly<GameState>, condition: StoryConditionAtom): boolean {
  switch (condition.type) {
    case 'QUEST_STATUS':
      return state.quests[condition.questId]?.status === condition.status;
    case 'QUEST_OBJECTIVE_COMPLETED':
      return state.quests[condition.questId]?.objectiveProgress[condition.objectiveId]?.completed === true;
    case 'FACT_EXISTS':
      return state.world.facts.some((fact) => fact.id === condition.factId);
    case 'PLAYER_KNOWS_FACT':
      return doesPlayerKnowFact(state, condition.factId);
    case 'NPC_KNOWS_FACT':
      return doesNpcKnowFact(state, condition.npcId, condition.factId);
    case 'RELATIONSHIP_MIN':
      return (state.relationships[condition.npcId]?.[condition.field] ?? 0) >= condition.value;
    case 'RELATIONSHIP_MAX':
      return (state.relationships[condition.npcId]?.[condition.field] ?? 0) <= condition.value;
    case 'MEMORY_EXISTS':
      return getMemoriesForNpc(state, condition.npcId).some((memory) => memory.type === condition.memoryType);
    case 'PLAYER_CLASS':
      return state.player.classId === condition.classId;
    case 'CURRENT_LOCATION':
      return state.world.currentLocationId === condition.locationId;
    case 'WORLD_FLAG': {
      const actual = state.world.flags[condition.flagId] === true;
      return actual === (condition.value ?? true);
    }
    case 'SCENE_VISITED':
      return visitedSceneIds(state).includes(condition.sceneId);
    case 'SCENE_NOT_VISITED':
      return !visitedSceneIds(state).includes(condition.sceneId);
    case 'NPC_PRESENT':
      return isNpcAtCurrentLocation(state, condition.npcId);
    case 'DAY_MIN':
      return (state.world.day ?? 1) >= condition.day;
    case 'CHAPTER_COMPLETED':
      return (state.story.completedChapterIds ?? []).includes(condition.chapterId);
    case 'PLAYER_LEVEL_MIN':
      return (state.player.level ?? 1) >= condition.level;
    default:
      return false;
  }
}
