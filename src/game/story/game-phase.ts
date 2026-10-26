import type { GameState } from '../core/game-state';
import type { GameEvent } from '../core/event';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { canonicalEncounterId } from '../combat/encounters/encounter-progress';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { playerHasRuinsKey } from '../quests/ruins-key-hunt';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { isHubLocation, worldFlag } from '../world/locations/location-selectors';
import { STORY_SEQUENCE_ID } from './sequences/chapter1-sequences';
import { STORY_FLOW_MODE } from './sequences/story-sequence-types';

/**
 * Player-facing play phase for Chapter 1 Action RPG pacing.
 */
export const GAME_PHASE = {
  VILLAGE: 'VILLAGE',
  ADVENTURE: 'ADVENTURE',
  COMBAT: 'COMBAT',
} as const;

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];

/** Sequences that lock the player into an adventure (no free village return). */
export const ADVENTURE_SEQUENCE_IDS: readonly string[] = [
  STORY_SEQUENCE_ID.FOREST_SCOUT,
  STORY_SEQUENCE_ID.RUINS_KEY_HUNT,
  STORY_SEQUENCE_ID.RUINS,
];

export function isAdventureSequenceId(sequenceId: string | null | undefined): boolean {
  return Boolean(sequenceId && ADVENTURE_SEQUENCE_IDS.includes(sequenceId));
}

export function getGamePhase(state: Readonly<GameState>): GamePhase {
  if (state.mode === 'COMBAT' || state.activeCombatId !== null) {
    return GAME_PHASE.COMBAT;
  }
  if (state.story.flowMode === STORY_FLOW_MODE.STORY_LOCKED && isAdventureSequenceId(state.story.currentSequenceId)) {
    return GAME_PHASE.ADVENTURE;
  }
  if (isAdventureMissionActive(state) && !isHubLocation(state.world.currentLocationId)) {
    return GAME_PHASE.ADVENTURE;
  }
  return GAME_PHASE.VILLAGE;
}

export function isVillagePhase(state: Readonly<GameState>): boolean {
  return getGamePhase(state) === GAME_PHASE.VILLAGE;
}

export function isAdventurePhase(state: Readonly<GameState>): boolean {
  return getGamePhase(state) === GAME_PHASE.ADVENTURE;
}

/**
 * True while a Chapter 1 field mission is underway (outside village).
 */
export function isAdventureMissionActive(state: Readonly<GameState>): boolean {
  if (isAdventureSequenceId(state.story.currentSequenceId)) {
    return true;
  }

  const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
  if (forest?.status === QUEST_STATUS.ACTIVE && forest.objectiveProgress.win_scouts?.completed !== true) {
    return !isHubLocation(state.world.currentLocationId);
  }

  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
  if (ruins?.status === QUEST_STATUS.ACTIVE) {
    if (!playerHasRuinsKey(state) && !isHubLocation(state.world.currentLocationId)) {
      return true;
    }
    if (
      playerHasRuinsKey(state) &&
      !worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN) &&
      (state.world.currentLocationId === LOCATION_ID.ANCIENT_RUINS ||
        (state.world.currentLocationId === LOCATION_ID.FOREST_ROAD &&
          (ruins.objectiveProgress.visit_ruins?.completed === true ||
            worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED))))
    ) {
      return true;
    }
  }

  return false;
}

export function resolveAdventureIdForDeparture(
  state: Readonly<GameState>,
  destinationId: string
): string | null {
  if (isAdventureSequenceId(state.story.currentSequenceId)) {
    return null;
  }

  const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
  if (
    destinationId === LOCATION_ID.FOREST_ROAD &&
    forest?.status === QUEST_STATUS.ACTIVE &&
    forest.objectiveProgress.win_scouts?.completed !== true
  ) {
    return STORY_SEQUENCE_ID.FOREST_SCOUT;
  }

  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
  if (ruins?.status === QUEST_STATUS.ACTIVE) {
    if (
      (destinationId === LOCATION_ID.FOREST_ROAD || destinationId === LOCATION_ID.ANCIENT_RUINS) &&
      !playerHasRuinsKey(state)
    ) {
      return STORY_SEQUENCE_ID.RUINS_KEY_HUNT;
    }
    if (destinationId === LOCATION_ID.ANCIENT_RUINS && playerHasRuinsKey(state)) {
      return STORY_SEQUENCE_ID.RUINS;
    }
    if (
      destinationId === LOCATION_ID.FOREST_ROAD &&
      playerHasRuinsKey(state) &&
      !worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN) &&
      !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)
    ) {
      // Heading out with key toward ruins — start ruins run when they leave for forest.
      return STORY_SEQUENCE_ID.RUINS;
    }
  }

  return null;
}

/** Adventure that is ready to close (mission beat finished). */
export function adventureReadyToEnd(state: Readonly<GameState>): string | null {
  const seq = state.story.currentSequenceId;
  if (seq === STORY_SEQUENCE_ID.FOREST_SCOUT || (!seq && state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status === QUEST_STATUS.ACTIVE)) {
    if (worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED)) {
      return STORY_SEQUENCE_ID.FOREST_SCOUT;
    }
  }
  if (seq === STORY_SEQUENCE_ID.RUINS_KEY_HUNT || (!playerHasRuinsKey(state) && state.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.ACTIVE)) {
    if (playerHasRuinsKey(state)) {
      return STORY_SEQUENCE_ID.RUINS_KEY_HUNT;
    }
  }
  if (seq === STORY_SEQUENCE_ID.RUINS) {
    if (worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED) || worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN)) {
      return STORY_SEQUENCE_ID.RUINS;
    }
  }
  if (playerHasRuinsKey(state) && state.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.ACTIVE) {
    // Key just acquired this frame — handled by caller with pre-key state.
  }
  return null;
}

export function eventsForAdventureStarted(adventureId: string): GameEvent[] {
  return [{ type: 'ADVENTURE_STARTED', adventureId }];
}

export function eventsForAdventureEnded(
  state: Readonly<GameState>,
  adventureId: string,
  options: { returnToVillage?: boolean } = {}
): GameEvent[] {
  const returnToVillage = options.returnToVillage !== false;
  const events: GameEvent[] = [{ type: 'ADVENTURE_ENDED', adventureId }];
  if (returnToVillage && !isHubLocation(state.world.currentLocationId)) {
    events.push(
      { type: 'LOCATION_LEFT', locationId: state.world.currentLocationId },
      { type: 'LOCATION_ENTERED', locationId: LOCATION_ID.LUEN_VILLAGE }
    );
    events.push({
      type: 'HISTORY_RECORDED',
      entry: {
        id: `history_adventure_return_${adventureId}_${state.world.turn}`,
        day: state.world.day ?? 1,
        locationId: LOCATION_ID.LUEN_VILLAGE,
        summary: '모험을 마치고 루엔으로 돌아왔다.',
        kind: 'CHAPTER',
      },
    });
  }
  return events;
}

export function isScoutCombatId(combatId: string): boolean {
  const id = canonicalEncounterId(combatId);
  return id === ENCOUNTER_ID.CH1_FOREST_SCOUTS || id === ENCOUNTER_ID.FOREST_GOBLIN_01;
}
