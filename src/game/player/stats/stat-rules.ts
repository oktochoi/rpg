import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { EMPTY_ALLOCATED_STATS, STAT_BONUS_PER_POINT, isStatId, type AllocatedStats, type StatId } from './stat-types';

export function allocatedStatBonuses(stats: AllocatedStats | undefined): { maxHp: number; maxMp: number; attack: number } {
  const allocated = stats ?? EMPTY_ALLOCATED_STATS;
  return {
    maxHp: allocated.vit * STAT_BONUS_PER_POINT.vit.maxHp,
    maxMp: allocated.int * STAT_BONUS_PER_POINT.int.maxMp,
    attack:
      allocated.str * STAT_BONUS_PER_POINT.str.attack +
      allocated.int * STAT_BONUS_PER_POINT.int.attack +
      allocated.agi * STAT_BONUS_PER_POINT.agi.attack,
  };
}

export function canAllocateStat(state: Readonly<GameState>, statId: string): { allowed: boolean; reason?: string } {
  if (!isStatId(statId)) {
    return { allowed: false, reason: '알 수 없는 능력치다.' };
  }
  if ((state.player.unspentStatPoints ?? 0) <= 0) {
    return { allowed: false, reason: '남은 능력치 포인트가 없다.' };
  }
  return { allowed: true };
}

export function eventsForAllocateStat(state: Readonly<GameState>, statId: StatId): GameEvent[] {
  if (!canAllocateStat(state, statId).allowed) {
    return [];
  }
  const sourceEventId = `stat:${statId}:${state.player.level}:${state.player.unspentStatPoints}:${state.world.turn}`;
  return [{ type: 'STAT_POINT_SPENT', statId, sourceEventId }];
}
