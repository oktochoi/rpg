import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { INN_REST_COST } from '../economy/economy-types';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { formatClock } from './clock-types';
import { eventsForRestClock } from './clock-rules';
import type { DayAdvanceReason } from './day-types';

export const REST_LOCATION_ID = LOCATION_ID.BLUE_MOON_INN;

export function storyFreeRestAvailable(state: Readonly<GameState>): boolean {
  return (
    state.world.currentLocationId === REST_LOCATION_ID &&
    worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE) &&
    !worldFlag(state, WORLD_FLAG.STORY_FREE_REST_USED) &&
    !worldFlag(state, WORLD_FLAG.EPILOGUE_REST_DONE)
  );
}

export function restGoldCost(state: Readonly<GameState>): number {
  return storyFreeRestAvailable(state) ? 0 : INN_REST_COST;
}

export function canRest(state: Readonly<GameState>): { allowed: boolean; reason?: string } {
  if (state.mode === 'COMBAT' || state.mode === 'RESOLVING') {
    return { allowed: false, reason: '지금은 쉴 수 없습니다.' };
  }
  if (state.world.currentLocationId !== REST_LOCATION_ID) {
    return { allowed: false, reason: '여관에서만 하루를 쉴 수 있다.' };
  }
  const cost = restGoldCost(state);
  if (cost > 0 && state.player.gold < cost) {
    return { allowed: false, reason: `${cost}G가 필요합니다.` };
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
  const cost = restGoldCost(state);
  const free = cost === 0;
  const events: GameEvent[] = [...clockEvents];
  if (cost > 0) {
    events.push({
      type: 'PLAYER_GOLD_SPENT',
      amount: cost,
      reason: 'REST',
      sourceEventId: `rest:gold:${state.world.turn}`,
    });
  }
  if (free) {
    events.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.STORY_FREE_REST_USED, value: true });
  }
  if (worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE) && !worldFlag(state, WORLD_FLAG.EPILOGUE_REST_DONE)) {
    events.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.EPILOGUE_REST_DONE, value: true });
  }
  events.push(
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
        summary: free
          ? '마르타가 오늘만큼은 돈을 받지 않았다. 다음 날 아침을 맞았다.'
          : '여관에서 하룻밤을 보내고 다음 날 아침을 맞았다.',
        kind: 'REST',
      },
    }
  );
  return events;
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
        narrative: restGoldCost(state) === 0
          ? '마르타가 손을 내저었다. “오늘만큼은 돈 받지 않을게.” 다음 날 아침이 밝았다.'
          : '다음 날 아침이 밝았다. 몸과 마음이 한결 가벼워졌다.',
        nextMode: 'STORY',
      },
    },
  ];
}
