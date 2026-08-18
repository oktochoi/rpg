import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import type { GoldReason } from './economy-types';

export function hasProcessedReward(state: Readonly<GameState>, sourceEventId: string): boolean {
  return (state.processedRewardIds ?? []).includes(sourceEventId);
}

export function eventsForGoldGained(
  state: Readonly<GameState>,
  amount: number,
  reason: GoldReason,
  sourceEventId: string
): GameEvent[] {
  if (amount <= 0 || hasProcessedReward(state, sourceEventId)) {
    return [];
  }
  return [{ type: 'PLAYER_GOLD_GAINED', amount, reason, sourceEventId }];
}

export function eventsForGoldSpent(
  state: Readonly<GameState>,
  amount: number,
  reason: GoldReason,
  sourceEventId: string
): GameEvent[] {
  if (amount <= 0) {
    return [];
  }
  if (state.player.gold < amount) {
    return [];
  }
  if (hasProcessedReward(state, sourceEventId)) {
    return [];
  }
  return [{ type: 'PLAYER_GOLD_SPENT', amount, reason, sourceEventId }];
}
