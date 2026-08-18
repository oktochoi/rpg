import type { GameState } from '../../core/game-state';
import type { NpcState } from '../../npc/npc-state';
import { explorationPointsAt } from '../exploration/exploration-definitions';
import { getLocationDefinition } from './location-definitions';
import type { LocationAccessRequirement, LocationContext, LocationRuntimeState } from './location-types';

export function getLocationRuntime(state: Readonly<GameState>, locationId: string): LocationRuntimeState | undefined {
  return state.world.locations[locationId];
}

export function getNpcsAtLocation(state: Readonly<GameState>, locationId: string): NpcState[] {
  return Object.values(state.npcs).filter((npc) => npc.locationId === locationId);
}

export function getCurrentLocationNpcs(state: Readonly<GameState>): NpcState[] {
  return getNpcsAtLocation(state, state.world.currentLocationId);
}

export function isNpcAtCurrentLocation(state: Readonly<GameState>, npcId: string): boolean {
  return state.npcs[npcId]?.locationId === state.world.currentLocationId;
}

export function isLocationDiscovered(state: Readonly<GameState>, locationId: string): boolean {
  return state.world.locations[locationId]?.discovered === true;
}

export function isLocationVisited(state: Readonly<GameState>, locationId: string): boolean {
  return state.world.locations[locationId]?.visited === true;
}

export function worldFlag(state: Readonly<GameState>, flagId: string): boolean {
  return state.world.flags[flagId] === true;
}

export function accessRequirementsMet(
  state: Readonly<GameState>,
  requirements: readonly LocationAccessRequirement[] | undefined
): boolean {
  if (!requirements || requirements.length === 0) {
    return true;
  }
  return requirements.every((requirement) => {
    if (requirement.type === 'QUEST_COMPLETED') {
      return state.quests[requirement.questId]?.status === 'COMPLETED';
    }
    if (requirement.type === 'FACT_KNOWN') {
      return state.knowledge.knownFactIds.includes(requirement.factId);
    }
    return worldFlag(state, requirement.flagId);
  });
}

export function getLocationDescription(locationId: string, state: Readonly<GameState>): string {
  const definition = getLocationDefinition(locationId);
  if (!definition) {
    return '알 수 없는 장소다.';
  }
  if (locationId === 'ancient_ruins') {
    if (worldFlag(state, 'ruins_guardian_defeated')) {
      return `${definition.description} 수호자가 쓰러진 뒤, 더 깊은 길이 열려 있다.`;
    }
    if (worldFlag(state, 'ruins_goblins_defeated')) {
      return `${definition.description} 폐허는 이전보다 조용하다.`;
    }
    return `${definition.description} 안쪽에서 고블린들의 기척이 들린다.`;
  }
  if (locationId === 'northern_gate' && !worldFlag(state, 'northern_gate_open')) {
    return `${definition.description} 지금은 문을 통과할 수 없다.`;
  }
  return definition.description;
}

export function reachableLocationIds(state: Readonly<GameState>): string[] {
  const current = getLocationDefinition(state.world.currentLocationId);
  if (!current) {
    return [];
  }
  return current.connectedLocationIds.filter((locationId) => {
    const definition = getLocationDefinition(locationId);
    if (!definition) {
      return false;
    }
    if (definition.discoveryRequired && !isLocationDiscovered(state, locationId)) {
      return false;
    }
    return accessRequirementsMet(state, definition.accessRequirements);
  });
}

export function buildLocationContext(state: Readonly<GameState>): LocationContext | null {
  const current = getLocationDefinition(state.world.currentLocationId);
  if (!current) {
    return null;
  }
  const connected = current.connectedLocationIds
    .map((id) => getLocationDefinition(id))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item) => !item.discoveryRequired || isLocationDiscovered(state, item.id));
  return {
    currentLocation: current,
    connectedLocations: connected,
    presentNpcIds: getCurrentLocationNpcs(state).map((npc) => npc.id),
    availableEncounterIds: current.encounterIds ?? [],
    explorationPointIds: explorationPointsAt(current.id).map((point) => point.id),
    flags: state.world.flags,
  };
}
