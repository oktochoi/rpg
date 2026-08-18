import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { dayFromTotalMinutes, nextMorningTotalMinutes } from './clock-types';

export function eventsForTimeAdvance(
  state: Readonly<GameState>,
  minutes: number,
  reason: string,
  sourceActionId: string
): GameEvent[] {
  if (minutes <= 0) {
    return [];
  }
  const previousTotalMinutes = state.world.totalMinutes ?? 0;
  const newTotalMinutes = previousTotalMinutes + minutes;
  const fromDay = dayFromTotalMinutes(previousTotalMinutes);
  const toDay = dayFromTotalMinutes(newTotalMinutes);
  const events: GameEvent[] = [
    {
      type: 'TIME_ADVANCED',
      minutes,
      reason,
      sourceActionId,
      previousTotalMinutes,
      newTotalMinutes,
    },
  ];
  if (toDay > fromDay) {
    events.push({ type: 'DAY_ADVANCED', fromDay, toDay, reason: reason === 'REST' ? 'REST' : 'STORY' });
  }
  return events;
}

export function eventsForRestClock(state: Readonly<GameState>, sourceActionId: string): GameEvent[] {
  const previousTotalMinutes = state.world.totalMinutes ?? 0;
  const newTotalMinutes = nextMorningTotalMinutes(previousTotalMinutes);
  const minutes = Math.max(0, newTotalMinutes - previousTotalMinutes);
  const fromDay = dayFromTotalMinutes(previousTotalMinutes);
  const toDay = dayFromTotalMinutes(newTotalMinutes);
  return [
    {
      type: 'TIME_ADVANCED',
      minutes,
      reason: 'REST',
      sourceActionId,
      previousTotalMinutes,
      newTotalMinutes,
    },
    { type: 'DAY_ADVANCED', fromDay, toDay, reason: 'REST' },
  ];
}
