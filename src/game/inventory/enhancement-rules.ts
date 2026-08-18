import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { getItemDefinition } from './item-definitions';
import { isEquipped } from './item-selectors';
import { playerHasItem } from '../player/player-state';
import {
  enhancementCostFor,
  ENHANCEMENT_TIME_MINUTES,
  isEnhanceableSlot,
  MAX_ENHANCEMENT_LEVEL,
} from './enhancement-config';
import { eventsForTimeAdvance } from '../time/clock-rules';

export function enhancementLevelOf(state: Readonly<GameState>, itemId: string): number {
  const raw = state.player.equipmentEnhancements?.[itemId] ?? 0;
  return Math.max(0, Math.min(MAX_ENHANCEMENT_LEVEL, raw));
}

export function ownsOrEquips(state: Readonly<GameState>, itemId: string): boolean {
  return playerHasItem(state.player, itemId) || isEquipped(state.player.equipment, itemId);
}

export function canEnhanceHere(state: Readonly<GameState>): boolean {
  if (!worldFlag(state, WORLD_FLAG.ENHANCEMENT_UNLOCKED)) {
    return false;
  }
  const locationId = state.world.currentLocationId;
  return locationId === LOCATION_ID.LUEN_GENERAL_STORE || locationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD;
}

export function enhanceBlockedReason(state: Readonly<GameState>, itemId: string): string | null {
  if (!canEnhanceHere(state)) {
    return '잡화점이나 길드에서만 강화할 수 있다.';
  }
  const definition = getItemDefinition(itemId);
  if (!definition || !isEnhanceableSlot(definition.slot)) {
    return '이 물건은 강화할 수 없다.';
  }
  if (!ownsOrEquips(state, itemId)) {
    return '그런 물건을 가지고 있지 않다.';
  }
  const current = enhancementLevelOf(state, itemId);
  if (current >= MAX_ENHANCEMENT_LEVEL) {
    return '더 이상 강화할 수 없다.';
  }
  const cost = enhancementCostFor(current);
  if (state.player.gold < cost) {
    return '골드가 부족하다.';
  }
  return null;
}

export function eventsForEnhanceEquipment(state: Readonly<GameState>, itemId: string): GameEvent[] {
  if (enhanceBlockedReason(state, itemId)) {
    return [];
  }
  const current = enhancementLevelOf(state, itemId);
  const cost = enhancementCostFor(current);
  const sourceEventId = `enhance:${itemId}:${current}:${state.world.turn}`;
  return [
    {
      type: 'PLAYER_GOLD_SPENT',
      amount: cost,
      reason: 'ENHANCE',
      sourceEventId: `${sourceEventId}:gold`,
    },
    {
      type: 'EQUIPMENT_ENHANCED',
      itemId,
      fromLevel: current,
      toLevel: current + 1,
    },
    ...eventsForTimeAdvance(state, ENHANCEMENT_TIME_MINUTES, 'STORY', sourceEventId),
  ];
}
