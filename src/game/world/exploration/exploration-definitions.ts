import { CHAPTER_FACT_ID } from '../../knowledge/chapter-1-facts';
import { RUINS_SEAL_FACT_ID } from '../../quests/quest-definitions';
import { LOCATION_ID } from '../locations/location-definitions';
import type { ExplorationPointDefinition } from './exploration-types';

export const EXPLORATION_POINT_ID = {
  ROYAL_MAGIC_STONE: 'royal_magic_stone',
  FOREST_TRACKS: 'forest_tracks',
  FOREST_ABANDONED_PACK: 'forest_abandoned_pack',
  FOREST_SOUNDS: 'forest_sounds',
  FOREST_HERBS: 'forest_herbs',
  CAMP_CRATE: 'camp_crate',
  CAMP_MAP: 'camp_map',
  CAMP_GLOW: 'camp_glow',
  RUINS_BROKEN_STATUE: 'ruins_broken_statue',
  RUINS_OLD_INSCRIPTION: 'ruins_old_inscription',
  RUINS_MAGIC_RESIDUE: 'ruins_magic_residue',
} as const;

export const EXPLORATION_POINTS: Record<string, ExplorationPointDefinition> = {
  [EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE]: {
    id: EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE,
    locationId: LOCATION_ID.ANCIENT_RUINS,
    name: '부서진 제단',
    description: '금이 간 제단 위에 왕실 문장이 희미하게 남아 있다. 단순한 폐허가 아니다.',
    aliases: ['제단', '부서진 제단', '마법석', '문장'],
    discoverableFactId: RUINS_SEAL_FACT_ID,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.FOREST_TRACKS]: {
    id: EXPLORATION_POINT_ID.FOREST_TRACKS,
    locationId: LOCATION_ID.FOREST_ROAD,
    name: '고블린 발자국',
    description: '진흙에 작은 발자국이 겹쳐 있다. 숲 깊은 쪽에서 이쪽으로 이동한 흔적이다.',
    aliases: ['발자국', '흔적', '진흙'],
    discoverableFactId: CHAPTER_FACT_ID.FOREST_TRACKS,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.FOREST_ABANDONED_PACK]: {
    id: EXPLORATION_POINT_ID.FOREST_ABANDONED_PACK,
    locationId: LOCATION_ID.FOREST_ROAD,
    name: '버려진 짐',
    description: '찢긴 자루 안에 여관 장식과 마른 빵이 남아 있다. 마르타가 찾던 짐일지도 모른다.',
    aliases: ['짐', '자루', '가방', '배달'],
    discoverableFactId: CHAPTER_FACT_ID.FOREST_ABANDONED_PACK,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.FOREST_SOUNDS]: {
    id: EXPLORATION_POINT_ID.FOREST_SOUNDS,
    locationId: LOCATION_ID.FOREST_ROAD,
    name: '수풀의 기척',
    description: '앞쪽에서 짧은 숨소리와 활 시위를 고르는 소리가 난다. 정찰만이 아닐 수 있다.',
    aliases: ['소리', '기척', '수풀'],
    discoverableFactId: CHAPTER_FACT_ID.FOREST_SOUNDS,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.FOREST_HERBS]: {
    id: EXPLORATION_POINT_ID.FOREST_HERBS,
    locationId: LOCATION_ID.FOREST_ROAD,
    name: '길가의 약초',
    description: '이슬 맺힌 잎이 모여 있다. 길드 칠판에 적힌 약초와 같다.',
    aliases: ['약초', '풀', '잎'],
    discoverableFactId: CHAPTER_FACT_ID.FOREST_HERBS,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.CAMP_CRATE]: {
    id: EXPLORATION_POINT_ID.CAMP_CRATE,
    locationId: LOCATION_ID.FOREST_ROAD,
    name: '야영지 상자',
    description: '상자 안에 녹슨 화살촉과 훔친 듯한 천 조각이 있다.',
    aliases: ['상자', '화물', '화살'],
    discoverableFactId: CHAPTER_FACT_ID.GOBLIN_ARCHER_HINT,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.CAMP_MAP]: {
    id: EXPLORATION_POINT_ID.CAMP_MAP,
    locationId: LOCATION_ID.FOREST_ROAD,
    name: '얼룩진 지도 조각',
    description: '지도 조각에 폐허 쪽이 거칠게 표시되어 있다. 고블린이 그린 것은 아니다.',
    aliases: ['지도', '조각', '표시'],
    discoverableFactId: CHAPTER_FACT_ID.GOBLIN_MOVEMENT_TRACES,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.CAMP_GLOW]: {
    id: EXPLORATION_POINT_ID.CAMP_GLOW,
    locationId: LOCATION_ID.FOREST_ROAD,
    name: '푸른 잔광',
    description: '재 위에 옅은 푸른 잔광이 남았다. 고블린들이 폐허 쪽 기운을 따라 움직인 듯하다.',
    aliases: ['잔광', '푸른', '재'],
    discoverableFactId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.RUINS_BROKEN_STATUE]: {
    id: EXPLORATION_POINT_ID.RUINS_BROKEN_STATUE,
    locationId: LOCATION_ID.ANCIENT_RUINS,
    name: '부서진 석상',
    description: '석상의 자세는 수호자와 닮았다. 오래전에 같은 존재를 새긴 것 같다.',
    aliases: ['석상', '조각상', '수호'],
    discoverableFactId: CHAPTER_FACT_ID.RUINS_BROKEN_STATUE,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.RUINS_OLD_INSCRIPTION]: {
    id: EXPLORATION_POINT_ID.RUINS_OLD_INSCRIPTION,
    locationId: LOCATION_ID.ANCIENT_RUINS,
    name: '낡은 명문',
    description: '글자의 절반이 지워져 있다. “봉인”, “왕실” 정도만 읽힌다.',
    aliases: ['명문', '글자', '기록', '비문'],
    discoverableFactId: CHAPTER_FACT_ID.RUINS_OLD_INSCRIPTION,
    oneTime: true,
  },
  [EXPLORATION_POINT_ID.RUINS_MAGIC_RESIDUE]: {
    id: EXPLORATION_POINT_ID.RUINS_MAGIC_RESIDUE,
    locationId: LOCATION_ID.ANCIENT_RUINS,
    name: '마력의 잔여',
    description: '제단 근처 먼지가 아직 채 가라앉지 않았다. 당신보다 먼저 온 자가 있을 수 있다.',
    aliases: ['잔여', '마력', '먼지'],
    discoverableFactId: CHAPTER_FACT_ID.RUINS_MAGIC_RESIDUE,
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
