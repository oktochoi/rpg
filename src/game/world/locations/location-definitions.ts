import { ENCOUNTER_ID } from '../../combat/encounters/encounter-definitions';
import { REGION_ID } from '../regions/region-definitions';
import { LOCATION_TYPE, type LocationDefinition } from './location-types';

export const LOCATION_ID = {
  LUEN_VILLAGE: 'luen_village',
  BLUE_MOON_INN: 'blue_moon_inn',
  LUEN_ADVENTURERS_GUILD: 'luen_adventurers_guild',
  LUEN_GENERAL_STORE: 'luen_general_store',
  LUEN_TRAINING_GROUND: 'luen_training_ground',
  FOREST_ROAD: 'forest_road',
  ANCIENT_RUINS: 'ancient_ruins',
  NORTHERN_GATE: 'northern_gate',
} as const;

export const WORLD_FLAG = {
  RUINS_GOBLINS_DEFEATED: 'ruins_goblins_defeated',
  ROYAL_STONE_DISCOVERED: 'royal_stone_discovered',
  NORTHERN_GATE_OPEN: 'northern_gate_open',
  RUINS_COMBAT_LOST: 'ruins_combat_lost',
  RUINS_GUARDIAN_DEFEATED: 'ruins_guardian_defeated',
  RUINS_GUARDIAN_LOST: 'ruins_guardian_lost',
  CHAPTER_1_COMPLETE: 'chapter_1_complete',
  GUILD_REGISTERED: 'guild_registered',
  FOREST_TRACES_FOUND: 'forest_traces_found',
  FIRST_ADVANCEMENT_DONE: 'first_advancement_done',
  FOREST_GOBLIN_DEFEATED: 'forest_goblin_defeated',
  POST_GUARDIAN_INVESTIGATED: 'post_guardian_investigated',
  RUINS_ESCAPED: 'ruins_escaped',
  RETURNED_TO_LUEN: 'returned_to_luen',
  SERIA_FINAL_REPORT: 'seria_final_report',
  LEON_CONFRONTATION_DONE: 'leon_confrontation_done',
  EPILOGUE_REST_DONE: 'epilogue_rest_done',
  GUILD_RECOGNITION_DONE: 'guild_recognition_done',
  NORTHERN_GATE_HOOK_SEEN: 'northern_gate_hook_seen',
  SHOP_UNLOCKED: 'shop_unlocked',
  ENHANCEMENT_UNLOCKED: 'enhancement_unlocked',
  FOREST_AMBUSH_CLEARED: 'forest_ambush_cleared',
  FOREST_DEEP_CLEARED: 'forest_deep_cleared',
  GOBLIN_CAMP_CLEARED: 'goblin_camp_cleared',
  GOBLIN_CAMP_OBSERVED: 'goblin_camp_observed',
  RUINS_GATE_CLEARED: 'ruins_gate_cleared',
  STORY_FREE_REST_USED: 'story_free_rest_used',
  EVIDENCE_RECORDED: 'evidence_recorded',
  GUARDIAN_FRAGMENT_TAKEN: 'guardian_fragment',
  BROKEN_SEAL_DETAIL: 'broken_seal_detail',
  LEFT_RUINS_EARLY: 'left_ruins_early',
  TOUCHED_STONE_RASHLY: 'touched_stone_rashly',
  SERIA_REPORT_FULL: 'seria_report_full',
  SERIA_REPORT_WITHHELD_EVIDENCE: 'seria_report_withheld_evidence',
  SERIA_REPORT_HUMAN_INTRUSION: 'seria_report_human_intrusion',
  SERIA_REPORT_HID_ROYAL: 'seria_report_hid_royal',
  RUINS_KEY_ACQUIRED: 'ruins_key_acquired',
  RUINS_KEY_HOLDER_UNLOCKED: 'ruins_key_holder_unlocked',
  RUINS_KEY_MISSION_STARTED: 'ruins_key_mission_started',
  RUINS_KEY_MISSION_REWARD_DONE: 'ruins_key_mission_reward_done',
} as const;

export const RUINS_GUARDIAN_FACT_ID = 'fact_important_event_ruins_guardian';

export const LOCATION_DEFINITIONS: Record<string, LocationDefinition> = {
  [LOCATION_ID.LUEN_VILLAGE]: {
    id: LOCATION_ID.LUEN_VILLAGE,
    regionId: REGION_ID.LUEN,
    name: '루엔 마을',
    description: '낮은 지붕과 흙길이 이어진 작은 마을이다. 사람들이 오가며 오늘의 소문을 나눈다.',
    type: LOCATION_TYPE.VILLAGE,
    connectedLocationIds: [
      LOCATION_ID.BLUE_MOON_INN,
      LOCATION_ID.LUEN_ADVENTURERS_GUILD,
      LOCATION_ID.LUEN_GENERAL_STORE,
      LOCATION_ID.LUEN_TRAINING_GROUND,
      LOCATION_ID.FOREST_ROAD,
      LOCATION_ID.NORTHERN_GATE,
    ],
    defaultNpcIds: ['seria', 'guard_01'],
    tags: ['village', 'start'],
    discoveryRequired: false,
    audioTheme: 'STORY_SAFE',
  },
  [LOCATION_ID.BLUE_MOON_INN]: {
    id: LOCATION_ID.BLUE_MOON_INN,
    regionId: REGION_ID.LUEN,
    name: '푸른 달 여관',
    description: '따뜻한 화롯불과 보리 향이 퍼지는 여관이다. 여행자와 소문이 모이는 곳이다.',
    type: LOCATION_TYPE.INN,
    connectedLocationIds: [LOCATION_ID.LUEN_VILLAGE],
    defaultNpcIds: ['innkeeper'],
    tags: ['inn', 'rumor'],
    discoveryRequired: false,
    audioTheme: 'STORY_SAFE',
  },
  [LOCATION_ID.LUEN_ADVENTURERS_GUILD]: {
    id: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    regionId: REGION_ID.LUEN,
    name: '루엔 모험가 길드',
    description: '낡은 나무 간판 아래, 신입 모험가를 받아 적는 작은 길드홀이다.',
    type: LOCATION_TYPE.SPECIAL,
    connectedLocationIds: [LOCATION_ID.LUEN_VILLAGE],
    defaultNpcIds: ['guildmaster_doran'],
    tags: ['guild', 'town'],
    discoveryRequired: false,
    audioTheme: 'STORY_SAFE',
  },
  [LOCATION_ID.LUEN_GENERAL_STORE]: {
    id: LOCATION_ID.LUEN_GENERAL_STORE,
    regionId: REGION_ID.LUEN,
    name: '루엔 잡화점',
    description: '약초 향과 쇠붙이 냄새가 섞인 작은 가게다. 신입 모험가가 쓸 만한 물건이 진열되어 있다.',
    type: LOCATION_TYPE.SPECIAL,
    connectedLocationIds: [LOCATION_ID.LUEN_VILLAGE],
    defaultNpcIds: ['shopkeeper_elin'],
    tags: ['shop', 'town'],
    discoveryRequired: false,
    audioTheme: 'STORY_SAFE',
  },
  [LOCATION_ID.LUEN_TRAINING_GROUND]: {
    id: LOCATION_ID.LUEN_TRAINING_GROUND,
    regionId: REGION_ID.LUEN,
    name: '루엔 훈련장',
    description: '말뚝과 허수아비가 줄지어 선 작은 마당이다. 바람이 짚을 스친다.',
    type: LOCATION_TYPE.SPECIAL,
    connectedLocationIds: [LOCATION_ID.LUEN_VILLAGE],
    defaultNpcIds: [],
    tags: ['training', 'town'],
    discoveryRequired: false,
    audioTheme: 'STORY_SAFE',
  },
  [LOCATION_ID.FOREST_ROAD]: {
    id: LOCATION_ID.FOREST_ROAD,
    regionId: REGION_ID.LUEN,
    name: '숲길',
    description: '마을과 폐허를 잇는 그늘진 길이다. 나뭇가지 사이로 먼 돌무더기가 보인다.',
    type: LOCATION_TYPE.ROAD,
    connectedLocationIds: [LOCATION_ID.LUEN_VILLAGE, LOCATION_ID.ANCIENT_RUINS],
    defaultNpcIds: [],
    encounterIds: [
      ENCOUNTER_ID.CH1_FOREST_SCOUTS,
      ENCOUNTER_ID.FOREST_GOBLIN_01,
      ENCOUNTER_ID.CH1_FOREST_AMBUSH,
      ENCOUNTER_ID.CH1_GOBLIN_CAMP,
      ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER,
    ],
    tags: ['forest', 'road', 'danger'],
    discoveryRequired: false,
    audioTheme: 'STORY_MYSTERY',
  },
  [LOCATION_ID.ANCIENT_RUINS]: {
    id: LOCATION_ID.ANCIENT_RUINS,
    regionId: REGION_ID.LUEN,
    name: '고대 폐허',
    description: '무너진 돌기둥 사이로 차가운 바람이 분다. 벽에는 오래된 흔적이 남아 있다.',
    type: LOCATION_TYPE.RUINS,
    connectedLocationIds: [LOCATION_ID.FOREST_ROAD],
    defaultNpcIds: [],
    tags: ['ruins', 'quest', 'danger'],
    // Location can be known; the stone gate still requires the ruins key.
    discoveryRequired: false,
    accessRequirements: [{ type: 'ITEM', itemId: 'ruins_old_key' }],
    accessDeniedReason:
      '무거운 석문이 굳게 닫혀 있다. 문 중앙의 오래된 열쇠구멍이 눈에 들어온다.',
    audioTheme: 'STORY_MYSTERY',
    encounterIds: [
      ENCOUNTER_ID.CH1_RUINS_GATE,
      ENCOUNTER_ID.RUINS_EASY_01,
      ENCOUNTER_ID.RUINS_MIXED_01,
      ENCOUNTER_ID.RUINS_HEAVY_01,
      ENCOUNTER_ID.RUINS_BOSS_01,
    ],
  },
  [LOCATION_ID.NORTHERN_GATE]: {
    id: LOCATION_ID.NORTHERN_GATE,
    regionId: REGION_ID.LUEN,
    name: '북문',
    description: '왕도로 이어지는 돌문이 굳게 닫혀 있다. 경비의 기척이 문루 위에 남아 있다.',
    type: LOCATION_TYPE.GATE,
    connectedLocationIds: [LOCATION_ID.LUEN_VILLAGE],
    defaultNpcIds: ['leon'],
    tags: ['gate', 'locked'],
    discoveryRequired: false,
    audioTheme: 'STORY_SAFE',
  },
};

export function getLocationDefinition(locationId: string): LocationDefinition | null {
  return LOCATION_DEFINITIONS[locationId] ?? null;
}

export function allLocationDefinitions(): readonly LocationDefinition[] {
  return Object.values(LOCATION_DEFINITIONS);
}

export function isKnownLocationId(locationId: string): boolean {
  return locationId in LOCATION_DEFINITIONS;
}
