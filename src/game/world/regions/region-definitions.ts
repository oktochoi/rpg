import type { RegionDefinition } from './region-types';

export const REGION_ID = {
  LUEN: 'luen_region',
} as const;

export const REGION_DEFINITIONS: Record<string, RegionDefinition> = {
  [REGION_ID.LUEN]: {
    id: REGION_ID.LUEN,
    name: '루엔 지방',
    description: '왕국 북서쪽의 작은 지방. 마을과 숲, 그리고 오래된 폐허가 이어져 있다.',
    locationIds: ['luen_village', 'blue_moon_inn', 'forest_road', 'ancient_ruins', 'northern_gate'],
  },
};

export function getRegionDefinition(regionId: string): RegionDefinition | null {
  return REGION_DEFINITIONS[regionId] ?? null;
}
