import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { isTalkChoice } from '../npc/talk-choices';
import { TEST_GOBLIN_COMBAT_ID } from './test-scenes';
import { evaluateStoryCondition } from './story-conditions';
import {
  getLocationFallbackSceneId,
  getStorySceneDefinition,
  allStorySceneDefinitions,
} from './story-scene-definitions';
import type { StoryResolveContext, StorySceneDefinition } from './story-scene-types';

function compareScenes(a: StorySceneDefinition, b: StorySceneDefinition): number {
  const priority = (b.priority ?? 10) - (a.priority ?? 10);
  if (priority !== 0) {
    return priority;
  }
  return a.id.localeCompare(b.id);
}

export function hasTalkTrigger(incoming: readonly { type: string; choiceId?: string }[] | undefined): boolean {
  if (!incoming) {
    return false;
  }
  return incoming.some((event) => {
    if (event.type === 'DIALOGUE_TURN_RECORDED' || event.type === 'DIALOGUE_STARTED') {
      return true;
    }
    return event.type === 'CHOICE_RESOLVED' && typeof event.choiceId === 'string' && isTalkChoice(event.choiceId);
  });
}

export function shouldAutoActivate(
  scene: StorySceneDefinition,
  context: StoryResolveContext | undefined
): boolean {
  if ((scene.activation ?? 'auto') !== 'on_talk') {
    return true;
  }
  return hasTalkTrigger(context?.incoming);
}

export function canEnterScene(
  sceneId: string,
  state: Readonly<GameState>,
  context?: StoryResolveContext
): boolean {
  const scene = getStorySceneDefinition(sceneId);
  if (!scene) {
    return false;
  }
  if (scene.locationId !== state.world.currentLocationId) {
    return false;
  }
  if (!evaluateStoryCondition(state, scene.entryConditions)) {
    return false;
  }
  return shouldAutoActivate(scene, context);
}

export function getAvailableScenes(
  state: Readonly<GameState>,
  locationId: string = state.world.currentLocationId,
  context?: StoryResolveContext
): StorySceneDefinition[] {
  return allStorySceneDefinitions()
    .filter((scene) => scene.locationId === locationId)
    .filter((scene) => evaluateStoryCondition(state, scene.entryConditions))
    .filter((scene) => shouldAutoActivate(scene, context))
    .slice()
    .sort(compareScenes);
}

export function getCurrentScene(state: Readonly<GameState>): StorySceneDefinition | null {
  return getStorySceneDefinition(state.story.currentSceneId);
}

export function resolveFallbackScene(state: Readonly<GameState>): StorySceneDefinition {
  const autoContext: StoryResolveContext = { incoming: [] };
  const available = getAvailableScenes(state, state.world.currentLocationId, autoContext);
  if (available.length > 0) {
    return available[0];
  }
  const fallbackId = getLocationFallbackSceneId(state.world.currentLocationId);
  const fallback = getStorySceneDefinition(fallbackId);
  if (fallback) {
    return fallback;
  }
  return allStorySceneDefinitions()[0];
}

export function isCurrentSceneValid(state: Readonly<GameState>): boolean {
  const scene = getCurrentScene(state);
  if (!scene) {
    return false;
  }
  if (scene.locationId !== state.world.currentLocationId) {
    return false;
  }
  return evaluateStoryCondition(state, scene.entryConditions);
}

export function resolveNextScene(
  state: Readonly<GameState>,
  context: StoryResolveContext = {}
): StorySceneDefinition {
  const available = getAvailableScenes(state, state.world.currentLocationId, context);
  if (available.length === 0) {
    return resolveFallbackScene(state);
  }
  const best = available[0];
  const currentId = state.story.currentSceneId;
  const currentAvailable = available.find((scene) => scene.id === currentId);
  if (currentAvailable) {
    const currentPriority = currentAvailable.priority ?? 10;
    const bestPriority = best.priority ?? 10;
    if (bestPriority <= currentPriority) {
      return currentAvailable;
    }
  }
  return best;
}

const RESOLVE_EVENT_TYPES = new Set<GameEvent['type']>([
  'LOCATION_ENTERED',
  'LOCATION_DISCOVERED',
  'WORLD_FLAG_SET',
  'COMBAT_WON',
  'COMBAT_LOST',
  'COMBAT_ENDED',
  'QUEST_AVAILABLE',
  'QUEST_STARTED',
  'QUEST_COMPLETED',
  'QUEST_OBJECTIVE_COMPLETED',
  'QUEST_OBJECTIVE_PROGRESS',
  'DIALOGUE_TURN_RECORDED',
  'DIALOGUE_STARTED',
  'CHOICE_RESOLVED',
  'ACTION_RESOLVED',
  'PLAYER_LEARNED_FACT',
  'NPC_LEARNED_FACT',
  'WORLD_FACT_RECORDED',
  'PLAYER_CLASS_UPDATED',
  'NPC_MEMORY_CREATED',
  'EXPLORATION_POINT_COMPLETED',
  'NPC_MOVED',
  'RELATIONSHIP_UPDATED',
  'NPC_RELATIONSHIP_CHANGED',
  'CHAPTER_COMPLETED',
  'CHAPTER_STARTED',
  'DAY_ADVANCED',
  'PLAYER_CLASS_PATH_CHOSEN',
  'PLAYER_LEVEL_UP',
  'TIME_ADVANCED',
]);

export function shouldResolveStory(incoming: readonly GameEvent[]): boolean {
  if (incoming.some((event) => event.type === 'STORY_SCENE_ENTERED')) {
    return false;
  }
  if (incoming.some((event) => event.type === 'GAME_STARTED' || event.type === 'GAME_LOADED')) {
    return false;
  }
  if (incoming.some((event) => event.type === 'COMBAT_STARTED')) {
    return false;
  }
  if (
    incoming.some(
      (event) =>
        (event.type === 'COMBAT_WON' || event.type === 'COMBAT_LOST') && event.combatId === TEST_GOBLIN_COMBAT_ID
    )
  ) {
    return false;
  }
  return incoming.some((event) => RESOLVE_EVENT_TYPES.has(event.type));
}

export interface SceneDebugInfo {
  sceneId: string;
  availableSceneIds: readonly string[];
  rejected: readonly { sceneId: string; reason: string }[];
}

export function debugSceneResolution(
  state: Readonly<GameState>,
  context: StoryResolveContext = {}
): SceneDebugInfo {
  const locationId = state.world.currentLocationId;
  const available = getAvailableScenes(state, locationId, context);
  const rejected = allStorySceneDefinitions()
    .filter((scene) => scene.locationId === locationId)
    .filter((scene) => !available.some((item) => item.id === scene.id))
    .map((scene) => {
      if (!evaluateStoryCondition(state, scene.entryConditions)) {
        return { sceneId: scene.id, reason: 'entryConditions' };
      }
      if (!shouldAutoActivate(scene, context)) {
        return { sceneId: scene.id, reason: 'on_talk' };
      }
      return { sceneId: scene.id, reason: 'filtered' };
    });
  return {
    sceneId: state.story.currentSceneId,
    availableSceneIds: available.map((scene) => scene.id),
    rejected,
  };
}
