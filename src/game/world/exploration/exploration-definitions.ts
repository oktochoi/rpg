import { RUINS_SEAL_FACT_ID } from '../../quests/quest-definitions';
import { LOCATION_ID } from '../locations/location-definitions';
import type { ExplorationPointDefinition } from './exploration-types';

export const EXPLORATION_POINT_ID = {
  ROYAL_MAGIC_STONE: 'royal_magic_stone',
} as const;

export const EXPLORATION_POINTS: Record<string, ExplorationPointDefinition> = {
  [EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE]: {
    id: EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE,
    locationId: LOCATION_ID.ANCIENT_RUINS,
    name: '부서진 제단',
    description: '금이 간 제단 위에 왕실 문장이 희미하게 남아 있다.',
    aliases: ['제단', '부서진 제단', '마법석', '문장'],
    discoverableFactId: RUINS_SEAL_FACT_ID,
    oneTime: true,
  },
};

export function getExplorationPoint(pointId: string): ExplorationPointDefinition | null {
  return EXPLORATION_POINTS[pointId] ?? null;
}

export function explorationPointsAt(locationId: string): ExplorationPointDefinition[] {
  return Object.values(EXPLORATION_POINTS).filter((point) => point.locationId === locationId);
}

export function resolveExplorationPointFromInput(locationId: string, text: string): ExplorationPointDefinition | null {
  const lower = text.toLowerCase();
  const points = explorationPointsAt(locationId);
  const matched = points.filter((point) =>
    point.aliases.some((alias) => lower.includes(alias.toLowerCase()) || text.includes(alias))
  );
  if (matched.length === 1) {
    return matched[0];
  }
  if (matched.length === 0 && points.length === 1 && /조사|살펴|자세히|내부/.test(text)) {
    return points[0];
  }
  return matched[0] ?? null;
}
