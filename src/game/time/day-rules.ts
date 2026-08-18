import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { LOCATION_ID } from '../world/locations/location-definitions';
import { INN_REST_COST } from '../economy/economy-types';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { formatClock } from './clock-types';
import { eventsForRestClock } from './clock-rules';
import type { DayAdvanceReason } from './day-types';

export const REST_LOCATION_ID = LOCATION_ID.BLUE_MOON_INN;

export function canRest(state: Readonly<GameState>): { allowed: boolean; reason?: string } {
  if (state.mode === 'COMBAT' || state.mode === 'RESOLVING') {
    return { allowed: false, reason: '지금은 쉴 수 없습니다.' };
  }
  if (state.world.currentLocationId !== REST_LOCATION_ID) {
    return { allowed: false, reason: '여관에서만 하루를 쉴 수 있다.' };
  }
  if (state.player.gold < INN_REST_COST) {
    return { allowed: false, reason: `숙박비가 부족하다. (${INN_REST_COST}G)` };
  }
  return { allowed: true };
}

export function eventsForRestEffects(state: Readonly<GameState>, _reason: DayAdvanceReason = 'REST'): GameEvent[] {
  const check = canRest(state);
  if (!check.allowed) {
    return [];
  }
  const clockEvents = eventsForRestClock(state, `rest:${state.world.turn}`);
  const timeEvent = clockEvents.find((event) => event.type === 'TIME_ADVANCED');
  const dayEvent = clockEvents.find((event) => event.type === 'DAY_ADVANCED');
  const derived = derivedPlayerStats(state.player);
  const toDay = dayEvent && dayEvent.type === 'DAY_ADVANCED' ? dayEvent.toDay : (state.world.day ?? 1) + 1;
  const fromDay = dayEvent && dayEvent.type === 'DAY_ADVANCED' ? dayEvent.fromDay : state.world.day ?? 1;
  const total = timeEvent && timeEvent.type === 'TIME_ADVANCED' ? timeEvent.newTotalMinutes : state.world.totalMinutes;
  return [
    ...clockEvents,
    {
      type: 'PLAYER_GOLD_SPENT',
      amount: INN_REST_COST,
      reason: 'REST',
      sourceEventId: `rest:gold:${state.world.turn}`,
    },
    {
      type: 'PLAYER_RESTORED',
      currentHp: derived.maxHp,
      currentMp: derived.maxMp,
    },
    {
      type: 'HISTORY_RECORDED',
      entry: {
        id: `history_rest_${fromDay}_${state.world.turn}`,
        day: toDay,
        totalMinutes: total,
        clock: formatClock(total ?? 0),
        locationId: state.world.currentLocationId,
        summary: '여관에서 하룻밤을 보내고 다음 날 아침을 맞았다.',
        kind: 'REST',
      },
    },
  ];
}

export function eventsForRest(state: Readonly<GameState>, reason: DayAdvanceReason = 'REST'): GameEvent[] {
  const effects = eventsForRestEffects(state, reason);
  if (effects.length === 0) {
    return [];
  }
  return [
    ...effects,
    {
      type: 'ACTION_RESOLVED',
      turnId: state.world.turn,
      resolution: {
        success: true,
        actionType: 'REST',
        narrative: '다음 날 아침이 밝았다. 몸과 마음이 한결 가벼워졌다.',
        nextMode: 'STORY',
      },
    },
  ];
}
