import { STORY_SCENE_ID } from '../story-scene-definitions';
import type { StorySequenceDefinition } from './story-sequence-types';

export const STORY_SEQUENCE_ID = {
  LUEN_ARRIVAL: 'seq_ch1_luen_arrival',
  FOREST_SCOUT: 'seq_ch1_forest_scout',
  FIRST_ADVANCEMENT: 'seq_ch1_first_advancement',
  SERIA_RUINS: 'seq_ch1_seria_ruins',
  RUINS_KEY_HUNT: 'seq_ch1_ruins_key_hunt',
  RUINS: 'seq_ch1_ruins',
  CHAPTER_FINALE: 'seq_ch1_finale',
} as const;

export type StorySequenceId = (typeof STORY_SEQUENCE_ID)[keyof typeof STORY_SEQUENCE_ID];

const hub = [
  STORY_SCENE_ID.LUEN_VILLAGE_HUB,
  STORY_SCENE_ID.LUEN_GUILD,
  STORY_SCENE_ID.LUEN_SHOP,
  STORY_SCENE_ID.LUEN_TRAINING_GROUND,
  STORY_SCENE_ID.BLUE_MOON_INN,
  STORY_SCENE_ID.FOREST_ROAD_DEFAULT,
  STORY_SCENE_ID.ANCIENT_RUINS_DEFAULT,
  STORY_SCENE_ID.NORTHERN_GATE,
] as const;

/**
 * Chapter 1 Story Sequences.
 * Scene IDs are preserved for save compatibility.
 */
export const CHAPTER_1_SEQUENCES: readonly StorySequenceDefinition[] = [
  {
    id: STORY_SEQUENCE_ID.LUEN_ARRIVAL,
    title: '루엔 도착',
    sceneIds: [
      STORY_SCENE_ID.LUEN_VILLAGE_INTRO,
      STORY_SCENE_ID.LUEN_SQUARE_LOOK,
      STORY_SCENE_ID.LUEN_ASK_DIRECTIONS,
      STORY_SCENE_ID.LUEN_GUILD_REGISTER,
      STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB,
    ],
    startSceneIds: [STORY_SCENE_ID.LUEN_VILLAGE_INTRO],
    completeSceneIds: [STORY_SCENE_ID.LUEN_GUILD_REGISTER, STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB],
    roamHubSceneIds: hub,
  },
  {
    id: STORY_SEQUENCE_ID.FOREST_SCOUT,
    title: '숲 정찰',
    sceneIds: [
      STORY_SCENE_ID.FOREST_ROAD_FIRST,
      STORY_SCENE_ID.FOREST_TRACES,
      STORY_SCENE_ID.FOREST_SCOUTS_AFTER,
      STORY_SCENE_ID.FOREST_AMBUSH,
      STORY_SCENE_ID.FOREST_AMBUSH_AFTER,
      STORY_SCENE_ID.FOREST_CAMP,
      STORY_SCENE_ID.FOREST_CAMP_OBSERVED,
      STORY_SCENE_ID.FOREST_CAMP_AFTER,
      STORY_SCENE_ID.LUEN_GUILD_SCOUT_REPORT,
    ],
    startSceneIds: [STORY_SCENE_ID.FOREST_ROAD_FIRST, STORY_SCENE_ID.FOREST_TRACES],
    // 전투 직후 보고는 FREE_ROAM — 상점/강화 루프를 막지 않는다.
    completeSceneIds: [STORY_SCENE_ID.FOREST_SCOUTS_AFTER, STORY_SCENE_ID.LUEN_GUILD_SCOUT_REPORT],
    roamHubSceneIds: hub,
  },
  {
    id: STORY_SEQUENCE_ID.FIRST_ADVANCEMENT,
    title: '1차 전직',
    sceneIds: [
      STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT,
      STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT_WAIT,
      STORY_SCENE_ID.LUEN_CLASS_CHOSEN,
    ],
    startSceneIds: [STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT],
    completeSceneIds: [STORY_SCENE_ID.LUEN_CLASS_CHOSEN, STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT],
    roamHubSceneIds: hub,
  },
  {
    id: STORY_SEQUENCE_ID.SERIA_RUINS,
    title: '세리아와 폐허',
    sceneIds: [
      STORY_SCENE_ID.LEON_FIRST_MEETING,
      STORY_SCENE_ID.SERIA_FIRST_MEETING,
      STORY_SCENE_ID.SERIA_ANOMALY,
      STORY_SCENE_ID.SERIA_RUINS_OFFER,
      STORY_SCENE_ID.SERIA_RUINS_ACTIVE,
    ],
    startSceneIds: [
      STORY_SCENE_ID.LEON_FIRST_MEETING,
      STORY_SCENE_ID.SERIA_FIRST_MEETING,
      STORY_SCENE_ID.SERIA_RUINS_OFFER,
    ],
    completeSceneIds: [STORY_SCENE_ID.SERIA_RUINS_OFFER, STORY_SCENE_ID.SERIA_RUINS_ACTIVE],
    roamHubSceneIds: hub,
  },
  {
    id: STORY_SEQUENCE_ID.RUINS_KEY_HUNT,
    title: '폐허로 향하다',
    // Field scenes only — hub/shop belong in roamHubSceneIds so village travel
    // cannot accidentally start this adventure sequence.
    sceneIds: [
      STORY_SCENE_ID.FOREST_ROAD_DEFAULT,
      STORY_SCENE_ID.FOREST_AMBUSH,
      STORY_SCENE_ID.FOREST_CAMP,
      STORY_SCENE_ID.FOREST_DEEPER,
    ],
    startSceneIds: [STORY_SCENE_ID.SERIA_RUINS_ACTIVE],
    completeSceneIds: [STORY_SCENE_ID.FOREST_DEEPER, STORY_SCENE_ID.ANCIENT_RUINS_ARRIVAL],
    roamHubSceneIds: hub,
  },
  {
    id: STORY_SEQUENCE_ID.RUINS,
    title: '폐허',
    sceneIds: [
      STORY_SCENE_ID.FOREST_DEEPER,
      STORY_SCENE_ID.ANCIENT_RUINS_ARRIVAL,
      STORY_SCENE_ID.ANCIENT_RUINS_ENEMY,
      STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY,
      STORY_SCENE_ID.ANCIENT_RUINS_AFTER_DEFEAT,
      STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY,
      STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION,
      STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_MAGE,
      STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_WARRIOR,
      STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_ROGUE,
      STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS,
      STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY,
      STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_DEFEAT,
      STORY_SCENE_ID.POST_GUARDIAN_AFTERMATH,
      STORY_SCENE_ID.POST_GUARDIAN_ESCAPE,
      STORY_SCENE_ID.FOREST_RETURN_EVENT,
      STORY_SCENE_ID.LUEN_RETURN_REACTION,
    ],
    startSceneIds: [STORY_SCENE_ID.FOREST_DEEPER, STORY_SCENE_ID.ANCIENT_RUINS_ARRIVAL],
    completeSceneIds: [STORY_SCENE_ID.LUEN_RETURN_REACTION, STORY_SCENE_ID.FOREST_RETURN_EVENT],
    roamHubSceneIds: hub,
  },
  {
    id: STORY_SEQUENCE_ID.CHAPTER_FINALE,
    title: '제1장 마무리',
    sceneIds: [
      STORY_SCENE_ID.SERIA_FINAL_REPORT,
      STORY_SCENE_ID.SERIA_REPORT_FOLLOWUP,
      STORY_SCENE_ID.SERIA_REPORT_UNKNOWN,
      STORY_SCENE_ID.SERIA_REPORT_KNOWN,
      STORY_SCENE_ID.LEON_CONFRONTATION,
      STORY_SCENE_ID.EPILOGUE_INN,
      STORY_SCENE_ID.GUILD_RECOGNITION,
      STORY_SCENE_ID.NORTHERN_GATE_EMERGENCY,
      STORY_SCENE_ID.NORTHERN_GATE_HOOK,
      STORY_SCENE_ID.CHAPTER_1_COMPLETE,
    ],
    startSceneIds: [STORY_SCENE_ID.SERIA_FINAL_REPORT, STORY_SCENE_ID.LEON_CONFRONTATION],
    completeSceneIds: [STORY_SCENE_ID.CHAPTER_1_COMPLETE],
    roamHubSceneIds: hub,
  },
];

export function getSequenceDefinition(sequenceId: string | null | undefined): StorySequenceDefinition | null {
  if (!sequenceId) {
    return null;
  }
  return CHAPTER_1_SEQUENCES.find((item) => item.id === sequenceId) ?? null;
}

export function findSequenceForScene(sceneId: string): StorySequenceDefinition | null {
  for (const sequence of CHAPTER_1_SEQUENCES) {
    if (sequence.startSceneIds.includes(sceneId)) {
      return sequence;
    }
    if (!sequence.sceneIds.includes(sceneId)) {
      continue;
    }
    // Shared hub fallback scenes must not claim ownership of adventure sequences.
    if (isHubRoamScene(sceneId) && ADVENTURE_SEQUENCE_IDS_LOCAL.includes(sequence.id)) {
      continue;
    }
    return sequence;
  }
  return null;
}

/** Local copy to avoid importing game-phase (circular). */
const ADVENTURE_SEQUENCE_IDS_LOCAL: readonly string[] = [
  STORY_SEQUENCE_ID.FOREST_SCOUT,
  STORY_SEQUENCE_ID.RUINS_KEY_HUNT,
  STORY_SEQUENCE_ID.RUINS,
];

export function findSequenceStartedBy(sceneId: string): StorySequenceDefinition | null {
  return CHAPTER_1_SEQUENCES.find((sequence) => sequence.startSceneIds.includes(sceneId)) ?? null;
}

export function isSequenceCompleteScene(sequence: StorySequenceDefinition, sceneId: string): boolean {
  return sequence.completeSceneIds.includes(sceneId);
}

export function isHubRoamScene(sceneId: string): boolean {
  return hub.includes(sceneId as (typeof hub)[number]);
}
