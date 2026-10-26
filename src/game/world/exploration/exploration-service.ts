import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { ENCOUNTER_ID } from '../../combat/encounters/encounter-definitions';
import { isEncounterCleared } from '../../combat/encounters/encounter-progress';
import { eventsForPlayerDiscoveredFact, eventsForRecordedFact } from '../../knowledge/knowledge-service';
import { createRuinsSealFact } from '../../quests/quest-progress';
import { getCurrentLocationNpcs } from '../locations/location-selectors';
import { EXPLORATION_POINT_ID, getExplorationPoint, resolveExplorationPointFromInput } from './exploration-definitions';
import type { ExplorationPointDefinition } from './exploration-types';

export function isExplorationPointCompleted(state: Readonly<GameState>, pointId: string): boolean {
  return state.world.exploredPointIds.includes(pointId);
}

export function resolveExplorationForInvestigate(
  state: Readonly<GameState>,
  rawInput: string,
  targetId?: string
): { point: ExplorationPointDefinition | null; alreadyExplored: boolean } {
  const point =
    (targetId ? getExplorationPoint(targetId) : null) ??
    resolveExplorationPointFromInput(state.world.currentLocationId, rawInput);
  if (!point || point.locationId !== state.world.currentLocationId) {
    return { point: null, alreadyExplored: false };
  }
  return { point, alreadyExplored: point.oneTime && isExplorationPointCompleted(state, point.id) };
}

export function eventsForExplorationPoint(state: Readonly<GameState>, point: ExplorationPointDefinition): GameEvent[] {
  if (point.oneTime && isExplorationPointCompleted(state, point.id)) {
    return [];
  }
  if (point.id === EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE && !isEncounterCleared(state, ENCOUNTER_ID.CH1_RUINS_GATE)) {
    return [];
  }
  if (
    (point.id === EXPLORATION_POINT_ID.GUARDIAN_CORE || point.id === EXPLORATION_POINT_ID.BROKEN_SEAL_AFTER) &&
    !isEncounterCleared(state, ENCOUNTER_ID.RUINS_BOSS_01)
  ) {
    return [];
  }
  const events: GameEvent[] = [{ type: 'EXPLORATION_POINT_COMPLETED', pointId: point.id, locationId: point.locationId }];
  if (point.id === EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE) {
    const fact = createRuinsSealFact(state);
    const present = getCurrentLocationNpcs(state).map((npc) => npc.id);
    const withWitnesses = {
      ...fact,
      witnessIds: [...new Set(['player', ...present])],
    };
    if (!state.world.facts.some((item) => item.id === fact.id)) {
      events.push(...eventsForRecordedFact(withWitnesses));
    }
  } else if (point.discoverableFactId) {
    events.push(...eventsForPlayerDiscoveredFact(state, point.discoverableFactId, ['exploration', 'story']));
  }
  return events;
}
