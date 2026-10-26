import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { canUseFreeTravel } from '../../story/sequences';
import {
  adventureReadyToEnd,
  eventsForAdventureEnded,
  eventsForAdventureStarted,
  getGamePhase,
  GAME_PHASE,
  resolveAdventureIdForDeparture,
} from '../../story/game-phase';
import { QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { getLocationDefinition, isKnownLocationId, LOCATION_ID } from './location-definitions';
import { accessRequirementsMet, isHubLocation, isLocationDiscovered } from './location-selectors';

export interface MoveValidation {
  allowed: boolean;
  reason?: string;
}

export interface MoveValidationOptions {
  /** Authored story choice / system auto-return may move even while ADVENTURE. */
  fromStoryChoice?: boolean;
  /** Mission-complete auto return to village. */
  adventureReturn?: boolean;
}

function isAdventureDestination(state: Readonly<GameState>, locationId: string): boolean {
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY]?.status;
  const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status;
  if (locationId === LOCATION_ID.ANCIENT_RUINS) {
    return ruins === QUEST_STATUS.ACTIVE || ruins === QUEST_STATUS.AVAILABLE;
  }
  if (locationId === LOCATION_ID.FOREST_ROAD) {
    return (
      forest === QUEST_STATUS.ACTIVE ||
      forest === QUEST_STATUS.AVAILABLE ||
      ruins === QUEST_STATUS.ACTIVE ||
      ruins === QUEST_STATUS.AVAILABLE
    );
  }
  if (locationId === LOCATION_ID.NORTHERN_GATE) {
    return getGamePhase(state) === GAME_PHASE.VILLAGE;
  }
  return false;
}

/**
 * Village hub network: any hub ↔ hub, and hub → forest/gate when the village links there.
 * Avoids forcing guild → square → forest for every departure.
 */
function isHubNetworkRoutable(state: Readonly<GameState>, fromId: string, toId: string): boolean {
  if (isHubLocation(fromId) && isHubLocation(toId)) {
    return true;
  }
  if (isHubLocation(fromId)) {
    const village = getLocationDefinition(LOCATION_ID.LUEN_VILLAGE);
    if (village?.connectedLocationIds.includes(toId)) {
      return true;
    }
  }
  if (isHubLocation(toId)) {
    const village = getLocationDefinition(LOCATION_ID.LUEN_VILLAGE);
    const from = getLocationDefinition(fromId);
    if (from?.connectedLocationIds.includes(LOCATION_ID.LUEN_VILLAGE)) {
      return true;
    }
    if (village?.connectedLocationIds.includes(fromId)) {
      return true;
    }
  }
  void state;
  return false;
}

export function validateMoveDestination(
  state: Readonly<GameState>,
  locationId: string,
  options: MoveValidationOptions = {}
): MoveValidation {
  if (state.mode === 'COMBAT' || state.activeCombatId !== null) {
    return { allowed: false, reason: '전투 중에는 이동할 수 없습니다.' };
  }

  const phase = getGamePhase(state);
  const missionReady = Boolean(adventureReadyToEnd(state));

  // Adventure: hub return allowed via mission-complete or explicit story retreat choice.
  if (phase === GAME_PHASE.ADVENTURE && !options.adventureReturn) {
    if (isHubLocation(locationId)) {
      if (missionReady || options.fromStoryChoice) {
        // Allowed — eventsForMoveToLocation will emit ADVENTURE_ENDED + return.
      } else {
        return { allowed: false, reason: '모험 중에는 마을로 돌아갈 수 없다. 미션을 먼저 마치자.' };
      }
    } else if (!options.fromStoryChoice) {
      if (!isAdventureDestination(state, locationId) && locationId !== state.world.currentLocationId) {
        const fromForest = state.world.currentLocationId === LOCATION_ID.FOREST_ROAD;
        const toRuins = locationId === LOCATION_ID.ANCIENT_RUINS;
        const fromRuins = state.world.currentLocationId === LOCATION_ID.ANCIENT_RUINS;
        const toForest = locationId === LOCATION_ID.FOREST_ROAD;
        if (!((fromForest && toRuins) || (fromRuins && toForest))) {
          return { allowed: false, reason: '지금은 현재 모험 목표만 진행할 수 있다.' };
        }
      }
    }
  }

  // Village: free hub travel. Leaving for adventure destinations is allowed.
  if (phase === GAME_PHASE.VILLAGE && !options.fromStoryChoice && !canUseFreeTravel(state)) {
    if (!(isHubLocation(locationId) || isAdventureDestination(state, locationId))) {
      return { allowed: false, reason: '지금은 스토리 목표를 먼저 진행해야 한다.' };
    }
  }

  if (!isKnownLocationId(locationId)) {
    return { allowed: false, reason: '그곳으로 가는 길은 아직 알지 못한다.' };
  }
  if (locationId === state.world.currentLocationId) {
    return { allowed: false, reason: '이미 그 장소에 있다.' };
  }
  const current = getLocationDefinition(state.world.currentLocationId);
  const destination = getLocationDefinition(locationId);
  if (!current || !destination) {
    return { allowed: false, reason: '그곳으로 가는 길은 아직 알지 못한다.' };
  }
  const directlyConnected = current.connectedLocationIds.includes(locationId);
  const hubRoutable =
    phase === GAME_PHASE.VILLAGE && isHubNetworkRoutable(state, state.world.currentLocationId, locationId);
  if (!directlyConnected && !hubRoutable) {
    return { allowed: false, reason: '그곳으로 바로 갈 수는 없다.' };
  }
  if (destination.discoveryRequired && !isLocationDiscovered(state, locationId)) {
    return { allowed: false, reason: '그곳으로 가는 길은 아직 알지 못한다.' };
  }
  if (!accessRequirementsMet(state, destination.accessRequirements)) {
    return {
      allowed: false,
      reason: destination.accessDeniedReason ?? '지금은 그곳으로 갈 수 없다.',
    };
  }
  return { allowed: true };
}

export function validateMoveToLocation(
  state: Readonly<GameState>,
  locationId: string,
  options: MoveValidationOptions = {}
): MoveValidation {
  if (state.mode === 'RESOLVING') {
    return { allowed: false, reason: '지금은 이동할 수 없습니다.' };
  }
  return validateMoveDestination(state, locationId, options);
}

export function eventsForMoveToLocation(
  state: Readonly<GameState>,
  locationId: string,
  options: MoveValidationOptions = {}
): GameEvent[] {
  const check = validateMoveDestination(state, locationId, options);
  if (!check.allowed) {
    return [];
  }

  // Return to hub → close adventure (mission complete or voluntary retreat).
  if (isHubLocation(locationId) && getGamePhase(state) === GAME_PHASE.ADVENTURE) {
    const ready = adventureReadyToEnd(state);
    if (ready) {
      return eventsForAdventureEnded(state, ready, { returnToVillage: true });
    }
    if (options.fromStoryChoice || options.adventureReturn) {
      const retreatId = state.story.currentSequenceId ?? 'adventure_retreat';
      return eventsForAdventureEnded(state, retreatId, { returnToVillage: true });
    }
    return [];
  }

  const events: GameEvent[] = [
    { type: 'LOCATION_LEFT', locationId: state.world.currentLocationId },
    { type: 'LOCATION_ENTERED', locationId },
  ];
  const adventureId = resolveAdventureIdForDeparture(state, locationId);
  if (adventureId && getGamePhase(state) === GAME_PHASE.VILLAGE) {
    events.unshift(...eventsForAdventureStarted(adventureId));
  }
  return events;
}
