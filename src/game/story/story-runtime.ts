import type { GameState } from '../core/game-state';
import { storyChoicesForState } from '../quests/quest-story-choices';
import { getStoryScene } from './test-scenes';
import { getStorySceneDefinition } from './story-scene-definitions';
import { isCurrentSceneValid, resolveFallbackScene } from './story-scene-resolver';
import { CHAPTER_ID } from './chapters/chapter-types';

function presentNpcId(state: GameState, preferred?: string | null): string | null {
  const present = Object.values(state.npcs).filter((npc) => npc.locationId === state.world.currentLocationId);
  if (preferred && present.some((npc) => npc.id === preferred)) {
    return preferred;
  }
  return present[0]?.id ?? preferred ?? null;
}

export function withEnteredStoryScene(
  state: GameState,
  sceneId: string,
  options: { countVisit?: boolean } = {}
): GameState {
  const alreadyCurrent = state.story.currentSceneId === sceneId;
  const countVisit = options.countVisit !== false && !alreadyCurrent;
  const visited = [...(state.story.visitedSceneIds ?? [])];
  const counts = { ...(state.story.sceneVisitCount ?? {}) };
  if (countVisit) {
    if (!visited.includes(sceneId)) {
      visited.push(sceneId);
    }
    counts[sceneId] = (counts[sceneId] ?? 0) + 1;
  }
  const definition = getStorySceneDefinition(sceneId);
  const legacy = definition ? null : getStoryScene(sceneId);
  const presented: GameState = {
    ...state,
    mode: state.mode === 'COMBAT' ? state.mode : 'STORY',
    story: {
      ...state.story,
      currentSceneId: sceneId,
      previousSceneId: alreadyCurrent ? state.story.previousSceneId : state.story.currentSceneId,
      visitedSceneIds: visited,
      sceneVisitCount: counts,
      enteredAtTurn: alreadyCurrent ? state.story.enteredAtTurn : state.world.turn,
      currentNpcId: presentNpcId(state, definition?.npcId ?? state.story.currentNpcId),
      narration: definition?.narrative ?? legacy?.narration ?? state.story.narration,
      flags: state.story.flags ?? {},
    },
  };
  return {
    ...presented,
    story: {
      ...presented.story,
      choices: storyChoicesForState(presented),
    },
  };
}

export function sanitizeStoryState(state: GameState): GameState {
  const normalized: GameState = {
    ...state,
    story: {
      ...state.story,
      visitedSceneIds: state.story.visitedSceneIds ?? [],
      sceneVisitCount: state.story.sceneVisitCount ?? {},
      flags: state.story.flags ?? {},
      currentChapterId: state.story.currentChapterId ?? CHAPTER_ID.CHAPTER_1_LUEN_RUINS,
      completedChapterIds: state.story.completedChapterIds ?? [],
      consumedTopicIds: state.story.consumedTopicIds ?? [],
      recentSemanticKeys: state.story.recentSemanticKeys ?? [],
    },
    world: {
      ...state.world,
      day: state.world.day ?? 1,
      clearedEncounterIds: state.world.clearedEncounterIds ?? [],
    },
    processedExpSourceIds: state.processedExpSourceIds ?? [],
    processedRewardIds: state.processedRewardIds ?? [],
    history: state.history ?? [],
    lastEconomyNotice: state.lastEconomyNotice ?? null,
    player: {
      ...state.player,
      level: state.player.level ?? 1,
      exp: state.player.exp ?? 0,
      attackPower: state.player.attackPower ?? 10,
      equipment: state.player.equipment ?? { weapon: null, armor: null, accessory: null },
      equipmentEnhancements: state.player.equipmentEnhancements ?? {},
      unspentStatPoints: state.player.unspentStatPoints ?? 0,
      allocatedStats: state.player.allocatedStats ?? { vit: 0, str: 0, int: 0, agi: 0 },
    },
  };
  if (isCurrentSceneValid(normalized)) {
    return withEnteredStoryScene(normalized, normalized.story.currentSceneId, { countVisit: false });
  }
  const fallback = resolveFallbackScene(normalized);
  return withEnteredStoryScene(normalized, fallback.id, { countVisit: false });
}
