import type { GameState } from '../../core/game-state';
import { ENCOUNTER_ID } from '../encounters/encounter-definitions';
import { QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../../world/locations/location-definitions';
import { worldFlag } from '../../world/locations/location-selectors';
import { doesPlayerKnowFact } from '../../knowledge/knowledge-selectors';
import { STORY_SCENE_ID } from '../../story/story-scene-definitions';

const SCOUT_IDS = [ENCOUNTER_ID.CH1_FOREST_SCOUTS, ENCOUNTER_ID.FOREST_GOBLIN_01] as const;

export function clearedEncounterIds(state: Readonly<GameState>): readonly string[] {
  return state.world.clearedEncounterIds ?? [];
}

export function isEncounterCleared(state: Readonly<GameState>, encounterId: string): boolean {
  if (clearedEncounterIds(state).includes(encounterId)) {
    return true;
  }
  if (SCOUT_IDS.includes(encounterId as (typeof SCOUT_IDS)[number])) {
    return worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED) || SCOUT_IDS.some((id) => clearedEncounterIds(state).includes(id));
  }
  if (encounterId === ENCOUNTER_ID.CH1_FOREST_AMBUSH) {
    return worldFlag(state, WORLD_FLAG.FOREST_AMBUSH_CLEARED);
  }
  if (encounterId === ENCOUNTER_ID.CH1_GOBLIN_CAMP) {
    return worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED);
  }
  if (encounterId === ENCOUNTER_ID.CH1_RUINS_GATE || encounterId === ENCOUNTER_ID.RUINS_MIXED_01) {
    return worldFlag(state, WORLD_FLAG.RUINS_GATE_CLEARED) || worldFlag(state, WORLD_FLAG.RUINS_GOBLINS_DEFEATED);
  }
  if (encounterId === ENCOUNTER_ID.RUINS_BOSS_01) {
    return worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED);
  }
  return false;
}

export function canonicalEncounterId(encounterId: string): string {
  if (encounterId === ENCOUNTER_ID.FOREST_GOBLIN_01) {
    return ENCOUNTER_ID.CH1_FOREST_SCOUTS;
  }
  if (encounterId === ENCOUNTER_ID.RUINS_MIXED_01) {
    return ENCOUNTER_ID.CH1_RUINS_GATE;
  }
  return encounterId;
}

export function flagForClearedEncounter(encounterId: string): string | null {
  const id = canonicalEncounterId(encounterId);
  if (id === ENCOUNTER_ID.CH1_FOREST_SCOUTS) {
    return WORLD_FLAG.FOREST_GOBLIN_DEFEATED;
  }
  if (id === ENCOUNTER_ID.CH1_FOREST_AMBUSH) {
    return WORLD_FLAG.FOREST_AMBUSH_CLEARED;
  }
  if (id === ENCOUNTER_ID.CH1_GOBLIN_CAMP) {
    return WORLD_FLAG.GOBLIN_CAMP_CLEARED;
  }
  if (id === ENCOUNTER_ID.CH1_RUINS_GATE) {
    return WORLD_FLAG.RUINS_GOBLINS_DEFEATED;
  }
  return null;
}

export function activeEncounterIdsForLocation(state: Readonly<GameState>): string[] {
  const locationId = state.world.currentLocationId;
  if (locationId === LOCATION_ID.FOREST_ROAD) {
    return forestEncounters(state);
  }
  if (locationId === LOCATION_ID.ANCIENT_RUINS) {
    return ruinsEncounters(state);
  }
  return [];
}

function forestEncounters(state: Readonly<GameState>): string[] {
  const ids: string[] = [];
  const scoutQuest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
  const scoutWanted =
    scoutQuest?.status === QUEST_STATUS.ACTIVE ||
    scoutQuest?.status === QUEST_STATUS.AVAILABLE ||
    worldFlag(state, WORLD_FLAG.GUILD_REGISTERED);
  if (scoutWanted && !isEncounterCleared(state, ENCOUNTER_ID.CH1_FOREST_SCOUTS)) {
    ids.push(ENCOUNTER_ID.CH1_FOREST_SCOUTS);
  }
  if (isEncounterCleared(state, ENCOUNTER_ID.CH1_FOREST_SCOUTS) && !isEncounterCleared(state, ENCOUNTER_ID.CH1_FOREST_AMBUSH)) {
    ids.push(ENCOUNTER_ID.CH1_FOREST_AMBUSH);
  }
  const campQuest = state.quests[QUEST_ID.LEON_GOBLIN_WATCH];
  if (campQuest?.status === QUEST_STATUS.ACTIVE && !isEncounterCleared(state, ENCOUNTER_ID.CH1_GOBLIN_CAMP)) {
    ids.push(ENCOUNTER_ID.CH1_GOBLIN_CAMP);
  }
  return ids;
}

function ruinsEncounters(state: Readonly<GameState>): string[] {
  const ids: string[] = [];
  if (!isEncounterCleared(state, ENCOUNTER_ID.CH1_RUINS_GATE)) {
    ids.push(ENCOUNTER_ID.CH1_RUINS_GATE);
  }
  const bossReady =
    doesPlayerKnowFact(state, 'fact_information_revealed_ruins_royal_seal') &&
    ((state.story.visitedSceneIds ?? []).includes(STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY) ||
      state.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS ||
      state.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_DEFEAT);
  if (bossReady && !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
    ids.push(ENCOUNTER_ID.RUINS_BOSS_01);
  }
  return ids;
}
