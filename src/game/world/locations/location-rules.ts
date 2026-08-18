import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { getLocationDefinition, isKnownLocationId } from './location-definitions';
import { accessRequirementsMet, isLocationDiscovered } from './location-selectors';

export interface MoveValidation {
  allowed: boolean;
  reason?: string;
}

export function validateMoveDestination(state: Readonly<GameState>, locationId: string): MoveValidation {
  if (state.mode === 'COMBAT' || state.activeCombatId !== null) {
    return { allowed: false, reason: '전투 중에는 이동할 수 없습니다.' };
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
  if (!current.connectedLocationIds.includes(locationId)) {
    return { allowed: false, reason: '그곳으로 바로 갈 수는 없다.' };
  }
  if (destination.discoveryRequired && !isLocationDiscovered(state, locationId)) {
    return { allowed: false, reason: '그곳으로 가는 길은 아직 알지 못한다.' };
  }
  if (!accessRequirementsMet(state, destination.accessRequirements)) {
    return { allowed: false, reason: '지금은 그곳으로 갈 수 없다.' };
  }
  return { allowed: true };
}

export function validateMoveToLocation(state: Readonly<GameState>, locationId: string): MoveValidation {
  if (state.mode === 'RESOLVING') {
    return { allowed: false, reason: '지금은 이동할 수 없습니다.' };
  }
  return validateMoveDestination(state, locationId);
}

export function eventsForMoveToLocation(state: Readonly<GameState>, locationId: string): GameEvent[] {
  const check = validateMoveDestination(state, locationId);
  if (!check.allowed) {
    return [];
  }
  return [
    { type: 'LOCATION_LEFT', locationId: state.world.currentLocationId },
    { type: 'LOCATION_ENTERED', locationId },
  ];
}
