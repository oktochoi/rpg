import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { ITEM_ID } from '../inventory/item-definitions';
import { PLAYER_CLASS_ID } from '../player/classes';
import { CHAPTER_FACT_ID } from '../knowledge/chapter-1-facts';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { EXPLORATION_POINT_ID } from '../world/exploration/exploration-definitions';
import {
  CHOICE_INVESTIGATE_ALTAR,
  CHOICE_INVESTIGATE_AREA,
  CHOICE_LOOK_AROUND,
  CHOICE_MOVE_FOREST,
  CHOICE_MOVE_GATE,
  CHOICE_MOVE_GUILD,
  CHOICE_MOVE_INN,
  CHOICE_MOVE_RUINS,
  CHOICE_MOVE_SHOP,
  CHOICE_MOVE_TRAINING,
  CHOICE_MOVE_VILLAGE,
  CHOICE_OPEN_SHOP,
  CHOICE_FIGHT_FOREST_GOBLIN,
  CHOICE_PASS_GATE,
  CHOICE_START_TRAINING,
  CHOICE_TALK_LEON,
  CHOICE_TALK_MARTA,
  CHOICE_TALK_SERIA,
  CHOICE_TALK_DORAN,
  CHOICE_REGISTER_GUILD,
  CHOICE_REST_INN,
  CHOICE_BEGIN_JOURNEY,
} from '../world/locations/location-story-choices';
import { CHOICE_ASK_EVENT, CHOICE_ASK_IDENTITY, CHOICE_TALK_RUINS_PROGRESS } from '../npc/talk-choices';
import type { StoryChoiceDefinition, StoryCondition, StorySceneDefinition } from './story-scene-types';

const CHOICE_ACCEPT_RUINS_MYSTERY = 'accept_ruins_mystery';
const CHOICE_FIGHT_RUINS_MIXED = 'fight_ruins_mixed';
export const CHOICE_FIGHT_GUARDIAN = 'fight_ruins_guardian';
const CHOICE_REPORT_RUINS = 'report_ruins_mystery';
const CHOICE_GUARDIAN_ADVENTURER = 'guardian_victory_adventurer';
const CHOICE_GUARDIAN_WARRIOR = 'guardian_victory_warrior';
const CHOICE_GUARDIAN_MAGE = 'guardian_victory_mage';
const CHOICE_GUARDIAN_ROGUE = 'guardian_victory_rogue';

export const STORY_SCENE_ID = {
  LUEN_VILLAGE_INTRO: 'luen_village_intro',
  LUEN_VILLAGE_HUB: 'luen_village_hub',
  LUEN_VILLAGE_AFTER_SCOUTS: 'luen_village_after_scouts',
  LUEN_SQUARE_LOOK: 'luen_square_look',
  LUEN_ASK_DIRECTIONS: 'luen_ask_directions',
  LUEN_GUILD: 'luen_guild_default',
  LUEN_GUILD_REGISTER: 'luen_guild_register',
  LUEN_GUILD_ADVANCEMENT: 'luen_guild_first_advancement',
  LUEN_GUILD_ADVANCEMENT_WAIT: 'luen_guild_advancement_wait',
  LUEN_GUILD_FIRST_JOB: 'luen_guild_first_job',
  LUEN_GUILD_KNOWN: 'luen_guild_known',
  LUEN_GUILD_SCOUT_REPORT: 'luen_guild_scout_report',
  LUEN_SHOP_INTRO: 'luen_shop_intro',
  FOREST_AMBUSH: 'forest_ambush_optional',
  FOREST_AMBUSH_AFTER: 'forest_ambush_after',
  FOREST_CAMP: 'forest_goblin_camp',
  FOREST_CAMP_OBSERVED: 'forest_goblin_camp_observed',
  FOREST_CAMP_AFTER: 'forest_goblin_camp_after',
  FOREST_SCOUTS_AFTER: 'forest_scouts_after',
  FOREST_DEEPER: 'forest_road_deeper',
  LUEN_SHOP: 'luen_shop_default',
  LUEN_TRAINING_GROUND: 'luen_training_ground_default',
  LUEN_CLASS_CHOSEN: 'luen_class_chosen',
  MARTA_FIRST_MEETING: 'marta_first_meeting',
  MARTA_PARCEL_RETURN: 'marta_parcel_return',
  LEON_FIRST_MEETING: 'leon_first_meeting',
  FOREST_TRACES: 'forest_road_traces',
  SERIA_FIRST_MEETING: 'seria_first_meeting',
  SERIA_ANOMALY: 'seria_anomaly_talk',
  SERIA_RUINS_OFFER: 'seria_ruins_offer',
  SERIA_RUINS_ACTIVE: 'seria_ruins_active',
  SERIA_RUINS_COMPLETED: 'seria_ruins_completed',
  FOREST_ROAD_FIRST: 'forest_road_first_visit',
  FOREST_ROAD_DEFAULT: 'forest_road_default',
  ANCIENT_RUINS_ARRIVAL: 'ancient_ruins_arrival',
  ANCIENT_RUINS_ENEMY: 'ancient_ruins_enemy_encounter',
  ANCIENT_RUINS_AFTER_VICTORY: 'ancient_ruins_after_victory',
  ANCIENT_RUINS_AFTER_DEFEAT: 'ancient_ruins_after_defeat',
  ANCIENT_RUINS_INVESTIGATION: 'ancient_ruins_investigation',
  ANCIENT_RUINS_INVESTIGATION_MAGE: 'ancient_ruins_investigation_mage',
  ANCIENT_RUINS_INVESTIGATION_WARRIOR: 'ancient_ruins_investigation_warrior',
  ANCIENT_RUINS_INVESTIGATION_ROGUE: 'ancient_ruins_investigation_rogue',
  ANCIENT_RUINS_DISCOVERY: 'ancient_ruins_discovery',
  RUINS_GUARDIAN_AWAKENS: 'ruins_guardian_awakens',
  RUINS_GUARDIAN_AWAKENED: 'ruins_guardian_awakens',
  RUINS_GUARDIAN_AFTER_VICTORY: 'ruins_guardian_after_victory',
  RUINS_GUARDIAN_AFTER_DEFEAT: 'ruins_guardian_after_defeat',
  ANCIENT_RUINS_DEFAULT: 'ancient_ruins_default',
  SERIA_REPORT_UNKNOWN: 'seria_report_unknown',
  SERIA_REPORT_KNOWN: 'seria_report_known',
  SERIA_HIGH_TRUST: 'seria_high_trust_response',
  SERIA_LOW_TRUST: 'seria_low_trust_response',
  SERIA_FEAR: 'seria_fear_response',
  SERIA_SAVED_MEMORY: 'seria_saved_memory',
  BLUE_MOON_INN: 'blue_moon_inn_default',
  NORTHERN_GATE: 'northern_gate_default',
  CHAPTER_1_COMPLETE: 'chapter_1_complete',
  NORTHERN_GATE_HOOK: 'northern_gate_hook',
  POST_GUARDIAN_AFTERMATH: 'post_guardian_aftermath',
  POST_GUARDIAN_ESCAPE: 'post_guardian_escape',
  FOREST_RETURN_EVENT: 'forest_return_event',
  LUEN_RETURN_REACTION: 'luen_return_reaction',
  SERIA_FINAL_REPORT: 'seria_final_report',
  SERIA_REPORT_FOLLOWUP: 'seria_report_followup',
  LEON_CONFRONTATION: 'leon_confrontation',
  EPILOGUE_INN: 'epilogue_inn_rest',
  GUILD_RECOGNITION: 'guild_recognition',
  NORTHERN_GATE_EMERGENCY: 'northern_gate_emergency',
} as const;

export const SCENE_PRIORITY = {
  BLOCKING_SYSTEM: 220,
  FIRST_ADVANCEMENT_REQUIRED: 210,
  POST_BOSS_CRITICAL: 200,
  QUEST_CRITICAL: 190,
  CHAPTER_EPILOGUE: 180,
  STORY_FACT_REVEAL: 170,
  QUEST_REPORT: 160,
  CRITICAL: 150,
  CHAPTER: 140,
  QUEST: 130,
  BOSS: 130,
  SIDE_QUEST_CRITICAL: 140,
  COMBAT_RESULT: 120,
  NPC_CONTEXTUAL: 120,
  ENCOUNTER: 115,
  FACT: 110,
  OPTIONAL_ENCOUNTER: 100,
  REPORT: 100,
  MEMORY: 85,
  FEAR: 83,
  LOW_TRUST: 82,
  RELATIONSHIP: 80,
  LOCATION_SPECIAL: 80,
  TALK: 75,
  CLASS: 70,
  FIRST_VISIT: 55,
  GENERAL_INTERACTION: 40,
  DEFAULT: 20,
  FALLBACK: 0,
} as const;

export const CHOICE_INVESTIGATE_MAGE = 'investigate_as_mage';
export const CHOICE_INVESTIGATE_WARRIOR = 'investigate_as_warrior';
export const CHOICE_INVESTIGATE_ROGUE = 'investigate_as_rogue';
export const CHOICE_RECALL_SAVED = 'talk_seria_saved_memory';
export const CHOICE_SERIA_SECRET = 'talk_seria_personal_secret';
export const CHOICE_ENTER_CLASS_MAGE = 'enter_investigation_mage';
export const CHOICE_ENTER_CLASS_WARRIOR = 'enter_investigation_warrior';
export const CHOICE_ENTER_CLASS_ROGUE = 'enter_investigation_rogue';

const village = LOCATION_ID.LUEN_VILLAGE;
const ruins = LOCATION_ID.ANCIENT_RUINS;
const forest = LOCATION_ID.FOREST_ROAD;
const questId = QUEST_ID.RUINS_MYSTERY;

function allOf(...conditions: StoryCondition[]): StoryCondition {
  return { allOf: conditions };
}

function noneOf(...conditions: StoryCondition[]): StoryCondition {
  return { noneOf: conditions };
}

function loc(locationId: string): StoryCondition {
  return { type: 'CURRENT_LOCATION', locationId };
}

function move(id: string, text: string, locationId: string): StoryChoiceDefinition {
  return { id, text, action: { type: 'MOVE_TO_LOCATION', locationId } };
}

function talk(id: string, text: string, extra?: StoryCondition): StoryChoiceDefinition {
  return { id, text, conditions: extra, action: { type: 'TALK', promptId: id } };
}

function look(): StoryChoiceDefinition {
  return { id: CHOICE_LOOK_AROUND, text: '주변을 살핀다', action: { type: 'LOOK_AROUND' } };
}

function learn(id: string, text: string, factId: string, extra?: StoryCondition): StoryChoiceDefinition {
  return {
    id,
    text,
    conditions: extra,
    action: { type: 'LEARN_FACT', factId },
  };
}

function investigatePoint(id: string, text: string, pointId: string, extra?: StoryCondition): StoryChoiceDefinition {
  return {
    id,
    text,
    conditions: extra,
    action: { type: 'INVESTIGATE', targetId: pointId },
    choicePurpose: 'ROLEPLAY',
  };
}

function investigateForestHerbs(): StoryChoiceDefinition {
  return investigatePoint(
    'investigate_forest_herbs',
    '길가의 약초를 확인한다',
    EXPLORATION_POINT_ID.FOREST_HERBS,
    allOf(
      { type: 'QUEST_STATUS', questId: QUEST_ID.FOREST_HERB_GATHER, status: QUEST_STATUS.ACTIVE },
      noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_HERBS })
    )
  );
}

function investigateAltar(id: string, text: string, extra?: StoryCondition): StoryChoiceDefinition {
  return {
    id,
    text,
    conditions: extra,
    action: { type: 'INVESTIGATE', targetId: EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE },
    choicePurpose: 'PROGRESSION',
  };
}

export const LOCATION_FALLBACK_SCENE_ID: Readonly<Record<string, string>> = {
  [LOCATION_ID.LUEN_VILLAGE]: STORY_SCENE_ID.LUEN_VILLAGE_HUB,
  [LOCATION_ID.LUEN_ADVENTURERS_GUILD]: STORY_SCENE_ID.LUEN_GUILD,
  [LOCATION_ID.LUEN_GENERAL_STORE]: STORY_SCENE_ID.LUEN_SHOP,
  [LOCATION_ID.LUEN_TRAINING_GROUND]: STORY_SCENE_ID.LUEN_TRAINING_GROUND,
  [LOCATION_ID.FOREST_ROAD]: STORY_SCENE_ID.FOREST_ROAD_DEFAULT,
  [LOCATION_ID.ANCIENT_RUINS]: STORY_SCENE_ID.ANCIENT_RUINS_DEFAULT,
  [LOCATION_ID.BLUE_MOON_INN]: STORY_SCENE_ID.BLUE_MOON_INN,
  [LOCATION_ID.NORTHERN_GATE]: STORY_SCENE_ID.NORTHERN_GATE,
};

export const STORY_SCENES: Readonly<Record<string, StorySceneDefinition>> = {
  [STORY_SCENE_ID.LUEN_VILLAGE_INTRO]: {
    id: STORY_SCENE_ID.LUEN_VILLAGE_INTRO,
    locationId: village,
    title: '루엔 마을',
    narrative:
      '광장에 들어선다. 우물가에 행상인이 천을 펼쳐 두었고, 용병 둘이 그늘에 앉아 있다. 북문으로 난 돌문은 열려 있지만, 오가는 사람은 적다.',
    entryConditions: allOf(
      loc(village),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.GUILD_REGISTERED }),
      noneOf({ type: 'QUEST_STATUS', questId, status: QUEST_STATUS.AVAILABLE }),
      noneOf({ type: 'QUEST_STATUS', questId, status: QUEST_STATUS.ACTIVE }),
      noneOf({ type: 'QUEST_STATUS', questId, status: QUEST_STATUS.COMPLETED }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.CHAPTER_1_COMPLETE }),
      noneOf({ type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB })
    ),
    priority: SCENE_PRIORITY.FIRST_VISIT,
    fallbackSceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB,
    activation: 'auto',
    autoContinue: true,
    continueTo: STORY_SCENE_ID.LUEN_VILLAGE_HUB,
    onEnter: [
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN },
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD },
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE },
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.NORTHERN_GATE },
    ],
    choices: [
      {
        id: 'intro_continue',
        text: '광장으로 나선다',
        action: { type: 'CONTINUE', nextSceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB },
        choicePurpose: 'PROGRESSION',
      },
    ],
  },
  [STORY_SCENE_ID.LUEN_SQUARE_LOOK]: {
    id: STORY_SCENE_ID.LUEN_SQUARE_LOOK,
    locationId: village,
    title: '루엔 광장',
    narrative:
      '우물 옆에 행상인이 천을 펼쳐 놓았다. 북쪽 상단이 늦는다는 말, 숲에서 고블린이 도로 쪽으로 나온다는 말, 아이들이 북문 쪽 푸른 빛을 봤다는 말이 한 방향으로 모인다.\n잡화점 간판과 여관, 길드가 한눈에 들어온다.',
    activation: 'on_talk',
    entryConditions: allOf(loc(village), { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LUEN_SQUARE_LOOK }),
    priority: SCENE_PRIORITY.LOCATION_SPECIAL,
    onEnter: [
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE },
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.NORTHERN_GATE },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.LUEN_VILLAGE_LAYOUT },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.RUMOR_NORTHERN_TRADE },
    ],
    choices: [
      learn('square_merchant', '행상인에게 북쪽 교역을 묻는다', CHAPTER_FACT_ID.RUMOR_GOBLINS_INCREASING),
      move(CHOICE_MOVE_GUILD, '모험가 길드로 간다', LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      look(),
    ],
  },
  [STORY_SCENE_ID.LUEN_ASK_DIRECTIONS]: {
    id: STORY_SCENE_ID.LUEN_ASK_DIRECTIONS,
    locationId: village,
    title: '길 묻기',
    narrative:
      '경비병이 턱짓으로 길드 간판을 가리킨다.\n“저쪽이다. 요즘은 숲길에 고블린이 늘어서, 신입도 받아 적는다고 하더군. 세리아와 레온은 그 수를 두고 말이 다르다.”',
    activation: 'on_talk',
    entryConditions: allOf(loc(village), { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LUEN_ASK_DIRECTIONS }),
    priority: SCENE_PRIORITY.LOCATION_SPECIAL,
    onEnter: [
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.GUILD_LOCATION },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.RUMOR_GOBLINS_INCREASING },
    ],
    choices: [
      move(CHOICE_MOVE_GUILD, '가르친 길로 길드에 간다', LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      move(CHOICE_MOVE_INN, '여관부터 들른다', LOCATION_ID.BLUE_MOON_INN),
      look(),
    ],
  },
  [STORY_SCENE_ID.LUEN_VILLAGE_HUB]: {
    id: STORY_SCENE_ID.LUEN_VILLAGE_HUB,
    locationId: village,
    title: '루엔 마을',
    narrative:
      '광장 끝, 숲으로 난 흙길에 발자국이 겹쳐 있다. 경비 하나가 그 길을 보고 서 있다. 수풀이 한 번 흔들리고, 여관과 길드가 옆에 있다.',
    npcId: 'seria',
    entryConditions: loc(village),
    priority: SCENE_PRIORITY.DEFAULT,
    fallbackSceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB,
    choices: [
      {
        id: CHOICE_MOVE_GUILD,
        text: '모험가 길드로 간다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.GUILD_REGISTERED }),
        action: { type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'hub_ask_seria',
        text: '세리아에게 숲의 푸른 기운을 묻는다',
        conditions: noneOf({ type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.SERIA_FIRST_MEETING }),
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.SERIA_FIRST_MEETING },
        choicePurpose: 'DECISION',
      },
      {
        id: 'hub_square_again',
        text: '광장을 잠깐 둘러본다',
        conditions: noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.LUEN_VILLAGE_LAYOUT }),
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LUEN_SQUARE_LOOK },
        choicePurpose: 'DECISION',
      },
      look(),
    ],
  },
  [STORY_SCENE_ID.LUEN_VILLAGE_AFTER_SCOUTS]: {
    id: STORY_SCENE_ID.LUEN_VILLAGE_AFTER_SCOUTS,
    locationId: village,
    title: '루엔 마을',
    narrative:
      '숲길을 다녀온 신참 이야기가 광장에 돈다. 경비는 아직 그 길을 보지만, 낮의 루엔은 다시 장사를 시작한다.',
    npcId: 'seria',
    entryConditions: allOf(loc(village), { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED }),
    priority: SCENE_PRIORITY.GENERAL_INTERACTION,
    fallbackSceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB,
    choices: [
      {
        id: 'hub_ask_seria_after_scouts',
        text: '세리아에게 숲의 푸른 기운을 묻는다',
        conditions: noneOf({ type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.SERIA_FIRST_MEETING }),
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.SERIA_FIRST_MEETING },
        choicePurpose: 'DECISION',
      },
      {
        id: 'hub_square_after_scouts',
        text: '광장을 잠깐 둘러본다',
        conditions: noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.LUEN_VILLAGE_LAYOUT }),
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LUEN_SQUARE_LOOK },
        choicePurpose: 'DECISION',
      },
      look(),
    ],
  },
  [STORY_SCENE_ID.LUEN_GUILD]: {
    id: STORY_SCENE_ID.LUEN_GUILD,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '루엔 모험가 길드',
    narrative:
      '나무 바닥이 삐걱거린다. 칠판에 의뢰 쪽지가 몇 장 붙어 있고, 구석에서는 모험가들이 장비를 점검한다.\n카운터 너머로 도란이 장부를 펼친 채 신입을 평가하듯 올려다본다.',
    npcId: 'guildmaster_doran',
    npcDialogue: '장부에 없는 얼굴이군. 이름을 댈 거면 대고, 이미 올렸으면 칠판을 봐.',
    entryConditions: loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
    priority: SCENE_PRIORITY.DEFAULT,
    fallbackSceneId: STORY_SCENE_ID.LUEN_GUILD,
    choices: [
      {
        id: CHOICE_REGISTER_GUILD,
        text: '이름을 대고 모험가로 등록한다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.GUILD_REGISTERED }),
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LUEN_GUILD_REGISTER },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'guild_to_seria_after_scout',
        text: '마을로 가 세리아를 찾는다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.RUINS_MYSTERY, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'MOVE_TO_LOCATION', locationId: village },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'accept_forest_scouts',
        text: '칠판의 고블린 의뢰를 맡는다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.FOREST_GOBLIN_SCOUR, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'accept_forest_herbs',
        text: '칠판의 약초 채집을 맡는다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.FOREST_HERB_GATHER, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_HERB_GATHER },
      },
      talk(CHOICE_TALK_DORAN, '도란에게 말을 건다'),
    ],
  },
  [STORY_SCENE_ID.LUEN_GUILD_REGISTER]: {
    id: STORY_SCENE_ID.LUEN_GUILD_REGISTER,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '모험가 등록',
    narrative:
      '도란이 장부를 펼치고 펜을 멈춘다.\n“이름은? 허세는 필요 없다. 살아남을 정도만 말하면 된다.”',
    npcId: 'guildmaster_doran',
    npcDialogue: '이름을 대. 전투 경험은 솔직하게만.',
    activation: 'auto',
    isDecisionPoint: true,
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LUEN_GUILD_REGISTER },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.CHAPTER_1_COMPLETE })
    ),
    priority: SCENE_PRIORITY.QUEST_CRITICAL,
    onEnter: [
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.GUILD_REGISTERED, value: true },
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SHOP_UNLOCKED, value: true },
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.ENHANCEMENT_UNLOCKED, value: true },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.GUILD_BASIC_RULES },
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.FOREST_ROAD },
    ],
    choices: [
      {
        id: 'register_give_name',
        text: '이름을 댄다',
        action: { type: 'CONTINUE', nextSceneId: STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB },
        choicePurpose: 'PROGRESSION',
      },
      {
        ...learn('register_exp_none', '거의 없다고 말한다', CHAPTER_FACT_ID.GUILD_COMBAT_NONE),
        nextSceneId: STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB,
        choicePurpose: 'ROLEPLAY',
      },
      {
        ...learn('register_exp_some', '조금 있다고 말한다', CHAPTER_FACT_ID.GUILD_COMBAT_SOME),
        nextSceneId: STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB,
        choicePurpose: 'ROLEPLAY',
      },
      {
        ...learn('register_exp_confident', '자신 있다고 말한다', CHAPTER_FACT_ID.GUILD_COMBAT_CONFIDENT),
        nextSceneId: STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB,
        choicePurpose: 'ROLEPLAY',
      },
    ],
  },
  [STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB]: {
    id: STORY_SCENE_ID.LUEN_GUILD_FIRST_JOB,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '의뢰 칠판',
    narrative:
      '칠판에는 신입용 쪽지가 붙어 있다.\n숲길의 고블린. 마르타의 부탁은 여관에서. 약초 채집은 급하지 않다.',
    npcId: 'guildmaster_doran',
    npcDialogue: '이름은 장부에 올렸다. 신입은 숲길 고블린부터다. 푸른 빛은 마을에서 세리아에게 물어라.',
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      { type: 'QUEST_STATUS', questId: QUEST_ID.FOREST_GOBLIN_SCOUR, status: QUEST_STATUS.AVAILABLE }
    ),
    priority: SCENE_PRIORITY.GENERAL_INTERACTION,
    choices: [
      {
        id: 'accept_forest_scouts_scene',
        text: '고블린 정찰 의뢰를 맡는다',
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'ask_goblin_danger',
        text: '위험한지 짧게 묻는다',
        conditions: noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.ASKED_GOBLIN_DANGER }),
        action: { type: 'TALK', promptId: 'ask_quest_goblin_danger' },
      },
      move(CHOICE_MOVE_VILLAGE, '마을을 더 둘러본다', village),
    ],
  },
  [STORY_SCENE_ID.LUEN_GUILD_KNOWN]: {
    id: STORY_SCENE_ID.LUEN_GUILD_KNOWN,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '루엔 모험가 길드',
    narrative: '도란이 장부를 덮는다. 신입의 자리는 이미 정해져 있다.',
    npcId: 'guildmaster_doran',
    npcDialogue: '맡은 일이 남았으면 그걸 끝내라. 없으면 칠판을 봐라.',
    entryConditions: allOf(loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD), {
      type: 'WORLD_FLAG',
      flagId: WORLD_FLAG.GUILD_REGISTERED,
    }),
    priority: 30,
    fallbackSceneId: STORY_SCENE_ID.LUEN_GUILD,
    choices: [
      {
        id: 'accept_forest_scouts_known',
        text: '칠판의 고블린 의뢰를 맡는다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.FOREST_GOBLIN_SCOUR, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'accept_forest_herbs_known',
        text: '칠판의 약초 채집을 맡는다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.FOREST_HERB_GATHER, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_HERB_GATHER },
      },
      talk(CHOICE_TALK_DORAN, '도란에게 말을 건다'),
    ],
  },
  [STORY_SCENE_ID.LUEN_GUILD_SCOUT_REPORT]: {
    id: STORY_SCENE_ID.LUEN_GUILD_SCOUT_REPORT,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '정찰 보고',
    narrative:
      '도란이 장부를 펼친다.\n“살아 돌아왔군. 이상한 점이 있으면 그것부터 말해.”\n보고가 끝나면 세리아가 폐허를 물을 것이다.',
    npcId: 'guildmaster_doran',
    npcDialogue: '확인한 것만 적겠다. 끝나면 길의 선택부터 하고, 마을에서 세리아를 찾아봐.',
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      { type: 'QUEST_STATUS', questId: QUEST_ID.FOREST_GOBLIN_SCOUR, status: QUEST_STATUS.ACTIVE },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LUEN_GUILD_SCOUT_REPORT }
    ),
    priority: SCENE_PRIORITY.QUEST_REPORT,
    choices: [
      {
        id: 'report_blue_glow',
        text: '푸른 잔광과 고블린 이동을 보고한다',
        conditions: allOf(
          { type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW },
          noneOf({ type: 'NPC_KNOWS_FACT', npcId: 'guildmaster_doran', factId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW })
        ),
        action: { type: 'SHARE_FACT', factId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW, toId: 'guildmaster_doran' },
        choicePurpose: 'PROGRESSION',
      },
      talk(CHOICE_TALK_DORAN, '정찰 결과를 보고한다'),
      {
        id: 'report_tracks',
        text: '이동 흔적만 짧게 전한다',
        conditions: { type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_TRACKS },
        action: { type: 'SHARE_FACT', factId: CHAPTER_FACT_ID.FOREST_TRACKS, toId: 'guildmaster_doran' },
      },
    ],
  },
  [STORY_SCENE_ID.LUEN_SHOP_INTRO]: {
    id: STORY_SCENE_ID.LUEN_SHOP_INTRO,
    locationId: LOCATION_ID.LUEN_GENERAL_STORE,
    title: '잡화점',
    narrative:
      '엘린이 진열장을 닦으며 고개를 든다.\n“신참인가? 숲으로 갈 거면 무기는 제대로 챙겨. 물약이든 검이든, 한 번에 다 살 생각은 말고.”',
    npcId: 'shopkeeper_elin',
    npcDialogue: '신참인가. 숲으로 갈 거면 무기는 제대로 챙겨. 한 번에 다 살 생각은 말고.',
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_GENERAL_STORE),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.SHOP_UNLOCKED },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LUEN_SHOP_INTRO }
    ),
    priority: SCENE_PRIORITY.LOCATION_SPECIAL,
    choices: [
      { id: CHOICE_OPEN_SHOP, text: '물건을 살펴본다', action: { type: 'OPEN_SHOP' } },
      talk(
        'ask_elin_prices',
        '값을 묻는다',
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.ASKED_ELIN_PRICES })
      ),
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
    ],
  },
  [STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT]: {
    id: STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '길의 선택',
    narrative:
      '도란이 제1장의 장부를 덮고 빈 칸을 연다.\n“여기까지 왔으니, 이제 길을 정할 때다. 검사·마법사·도적 — 한 번 고르면 쉽게 바꾸지 못한다.”',
    npcId: 'guildmaster_doran',
    npcDialogue: '검사는 정면, 마법사는 거리, 도적은 틈. 한 번 정하면 쉽게 바꾸지 못한다.',
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.CHAPTER_1_COMPLETE },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.GUILD_REGISTERED },
      { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.ADVENTURER },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FIRST_ADVANCEMENT_DONE })
    ),
    priority: SCENE_PRIORITY.QUEST_CRITICAL,
    choices: [
      {
        id: 'choose_path_warrior',
        text: '검사의 길을 택한다',
        action: { type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR },
        choicePurpose: 'DECISION',
      },
      {
        id: 'choose_path_mage',
        text: '마법사의 길을 택한다',
        action: { type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.MAGE },
        choicePurpose: 'DECISION',
      },
      {
        id: 'choose_path_rogue',
        text: '도적의 길을 택한다',
        action: { type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.ROGUE },
        choicePurpose: 'DECISION',
      },
    ],
  },
  [STORY_SCENE_ID.LUEN_CLASS_CHOSEN]: {
    id: STORY_SCENE_ID.LUEN_CLASS_CHOSEN,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '길이 정해졌다',
    narrative:
      '도란이 장부에 새 길을 적는다.\n모험가였던 칸은 닫히고, 고른 이름이 그 자리를 대신한다.\n폐허의 봉인과 북문의 소문은 남았지만, 이번 이야기는 여기서 끝난다.',
    npcId: 'guildmaster_doran',
    npcDialogue: '길은 정했다. 루엔에서의 첫 장은 여기까지다.',
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FIRST_ADVANCEMENT_DONE }
    ),
    priority: SCENE_PRIORITY.QUEST_CRITICAL,
    choices: [
      {
        id: 'contest_story_end',
        text: '여기까지다',
        action: { type: 'TALK', promptId: 'contest_story_end' },
      },
    ],
  },
  [STORY_SCENE_ID.LUEN_TRAINING_GROUND]: {
    id: STORY_SCENE_ID.LUEN_TRAINING_GROUND,
    locationId: LOCATION_ID.LUEN_TRAINING_GROUND,
    title: '루엔 훈련장',
    narrative:
      '말뚝과 허수아비가 줄지어 서 있다.\n여기서는 경험치도 골드도 없다. 체력은 줄지 않고 마나는 마르지 않는다.',
    entryConditions: loc(LOCATION_ID.LUEN_TRAINING_GROUND),
    priority: SCENE_PRIORITY.LOCATION_SPECIAL,
    fallbackSceneId: STORY_SCENE_ID.LUEN_TRAINING_GROUND,
    choices: [
      {
        id: CHOICE_START_TRAINING,
        text: '허수아비를 상대로 훈련한다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.TRAINING_GROUNDS },
        choicePurpose: 'PROGRESSION',
      },
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
      look(),
    ],
  },
  [STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT_WAIT]: {
    id: STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT_WAIT,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '아직 이른 전직',
    narrative:
      '도란이 장부를 덮는다.\n“전직은 제1장을 마치고 난 뒤에 열어 주겠다. 폐허와 북문까지 보고 돌아와라. 지금은 모험가로 충분하다.”',
    npcId: 'guildmaster_doran',
    npcDialogue: '제1장을 마치고 돌아와라. 그때 길을 고르게 해 주겠다.',
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.ADVENTURER },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.GUILD_REGISTERED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FIRST_ADVANCEMENT_DONE })
    ),
    priority: 5,
    choices: [
      talk(CHOICE_TALK_DORAN, '알겠다'),
      move(CHOICE_MOVE_VILLAGE, '마을로 나간다', village),
    ],
  },
  [STORY_SCENE_ID.MARTA_FIRST_MEETING]: {
    id: STORY_SCENE_ID.MARTA_FIRST_MEETING,
    locationId: LOCATION_ID.BLUE_MOON_INN,
    title: '푸른 달 여관',
    narrative:
      '마르타가 잔을 닦으며 당신을 훑어본다.\n“루엔에는 처음이지? 여행 티가 난다. 북문 상단이 늦고, 숲 소문이 끊이질 않아. 길드는 광장 옆이야.”',
    npcId: 'innkeeper',
    npcDialogue: '방은 있으니 몸만 성하면 돼. 길드는 광장 옆이고, 요즘은 숲 소문이 끊이질 않아.',
    entryConditions: allOf(
      loc(LOCATION_ID.BLUE_MOON_INN),
      { type: 'NPC_PRESENT', npcId: 'innkeeper' },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.MARTA_FIRST_MEETING }
    ),
    priority: SCENE_PRIORITY.TALK,
    onEnter: [
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.RUMOR_GOBLINS_INCREASING },
    ],
    choices: [
      learn('marta_reason_adventure', '모험가가 되고 싶어서 왔다', CHAPTER_FACT_ID.PLAYER_CAME_TO_ADVENTURE),
      { id: CHOICE_REST_INN, text: '여관에서 쉰다', action: { type: 'REST' }, choicePurpose: 'DECISION' },
      move(CHOICE_MOVE_VILLAGE, '마을로 나간다', village),
    ],
  },
  [STORY_SCENE_ID.MARTA_PARCEL_RETURN]: {
    id: STORY_SCENE_ID.MARTA_PARCEL_RETURN,
    locationId: LOCATION_ID.BLUE_MOON_INN,
    title: '잃어버린 짐',
    narrative: '마르타가 자루를 받아 들고 한숨 쉰다.\n“찾았구나. 상태는 어떤데?”',
    npcId: 'innkeeper',
    npcDialogue: '찾았구나. 북문 통과 표가 붙어 있었지? 요즘은 북쪽 길이 흔들려서 짐이 숲에 떨어지곤 해. 고마워.',
    entryConditions: allOf(
      loc(LOCATION_ID.BLUE_MOON_INN),
      { type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_ABANDONED_PACK },
      { type: 'QUEST_STATUS', questId: QUEST_ID.MARTA_LOST_PARCEL, status: QUEST_STATUS.ACTIVE },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.MARTA_PARCEL_RETURN }
    ),
    priority: SCENE_PRIORITY.SIDE_QUEST_CRITICAL,
    choices: [
      talk(CHOICE_TALK_MARTA, '바로 돌려준다'),
      talk(CHOICE_TALK_MARTA, '상태를 확인했다고 말한다'),
      move(CHOICE_MOVE_VILLAGE, '마을로 나간다', village),
    ],
  },
  [STORY_SCENE_ID.LEON_FIRST_MEETING]: {
    id: STORY_SCENE_ID.LEON_FIRST_MEETING,
    locationId: LOCATION_ID.NORTHERN_GATE,
    title: '북문의 기사',
    narrative:
      '레온이 닫힌 북문 앞에서 당신을 멈춰 세운다. 그는 숲이 아니라 문턱의 흙을 본다.',
    npcId: 'leon',
    npcDialogue: '북문은 닫혀 있다. 숲에서 밀려 나온 것들이 문턱을 넘기 전에 막아야 한다.',
    entryConditions: allOf(
      loc(LOCATION_ID.NORTHERN_GATE),
      { type: 'NPC_PRESENT', npcId: 'leon' },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LEON_FIRST_MEETING },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.CHAPTER_1_COMPLETE }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FIRST_ADVANCEMENT_DONE }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.GUILD_RECOGNITION_DONE })
    ),
    priority: SCENE_PRIORITY.TALK,
    onEnter: [{ type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.NORTHERN_GATE }],
    choices: [
      talk(CHOICE_TALK_LEON, '마을 치안을 묻는다'),
      {
        id: 'leon_goblin_rumor',
        text: '숲길 고블린 이야기를 들었습니다',
        conditions: { type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.RUMOR_GOBLINS_INCREASING },
        action: { type: 'TALK', promptId: 'talk_leon_goblin_rumor' },
      },
      talk(CHOICE_TALK_LEON, '북문 상황을 묻는다'),
      {
        id: 'leon_seria_view_early',
        text: '세리아의 조사와 네 보고, 무엇이 먼저입니까',
        action: { type: 'TALK', promptId: 'leon_seria_view' },
      },
      {
        id: 'accept_leon_watch',
        text: '고블린 출몰을 조사하겠다고 한다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.LEON_GOBLIN_WATCH, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.LEON_GOBLIN_WATCH },
      },
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
    ],
  },
  [STORY_SCENE_ID.FOREST_TRACES]: {
    id: STORY_SCENE_ID.FOREST_TRACES,
    locationId: forest,
    title: '숲길의 흔적',
    narrative:
      '진흙의 발자국은 같은 방향으로 겹친다. 흩어진 도주가 아니다.\n발자국 옆에는 왕실 문양처럼 생긴 돌조각과, 자연스럽게 생긴 것이 아닌 푸른 마력이 남아 있다. 누가 봉인을 건드렸는지는 아직 모른다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.FOREST_ROAD_FIRST },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_TRACES_FOUND }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED })
    ),
    // Below FIRST_VISIT so follow-up resolve cannot steal the opening forest beat.
    priority: SCENE_PRIORITY.GENERAL_INTERACTION,
    onEnter: [
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.FOREST_TRACES_FOUND, value: true },
      { type: 'GRANT_ITEM', itemId: 'old_coin', quantity: 1, sourceEventId: 'story:forest_traces:old_coin' },
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.FOREST_ROAD },
    ],
    choices: [
      {
        id: CHOICE_FIGHT_FOREST_GOBLIN,
        text: '수풀에서 뛰쳐나온 고블린을 맞는다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED }),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS },
        choicePurpose: 'PROGRESSION',
      },
      investigatePoint('investigate_tracks', '발자국을 조사한다', EXPLORATION_POINT_ID.FOREST_TRACKS),
      investigatePoint('investigate_pack', '버려진 짐을 조사한다', EXPLORATION_POINT_ID.FOREST_ABANDONED_PACK),
      investigatePoint('investigate_sounds', '주변 소리를 살핀다', EXPLORATION_POINT_ID.FOREST_SOUNDS),
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
    ],
  },
  [STORY_SCENE_ID.SERIA_FIRST_MEETING]: {
    id: STORY_SCENE_ID.SERIA_FIRST_MEETING,
    locationId: village,
    title: '세리아와의 첫 만남',
    narrative: '세리아가 숲 쪽 하늘을 본다. 푸른 빛은 지붕 너머로 가늘게 남아 있다.',
    npcId: 'seria',
    npcDialogue: '어젯밤부터 숲 쪽에서 푸른 빛이 보여. 고블린이 내려온 것도 그때부터고. 이상한 건… 놈들이 도망치는 것처럼 보인다는 거야.',
    activation: 'on_talk',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.SERIA_FIRST_MEETING },
      { type: 'QUEST_STATUS', questId, status: QUEST_STATUS.LOCKED }
    ),
    priority: SCENE_PRIORITY.TALK,
    choices: [
      talk(
        CHOICE_ASK_EVENT,
        '푸른 빛에 대해 묻는다',
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.SERIA_BLUE_PULSE })
      ),
      { id: 'seria_end_first', text: '나중에 다시 말한다', action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB } },
    ],
  },
  [STORY_SCENE_ID.SERIA_ANOMALY]: {
    id: STORY_SCENE_ID.SERIA_ANOMALY,
    locationId: village,
    title: '이상한 기운',
    narrative:
      '세리아가 숲 쪽을 본다. 지붕 너머의 빛이 한 박자 늦게 흔들린다.',
    npcId: 'seria',
    npcDialogue: '마력 자체가 비정상적이야. 이 흔적은 폐허 안쪽에서 새어 나온 것 같아.',
    activation: 'auto',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.SERIA_FIRST_MEETING },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.SERIA_ANOMALY },
      noneOf({ type: 'QUEST_STATUS', questId, status: QUEST_STATUS.ACTIVE }),
      noneOf({ type: 'QUEST_STATUS', questId, status: QUEST_STATUS.COMPLETED }),
      noneOf({ type: 'QUEST_STATUS', questId, status: QUEST_STATUS.AVAILABLE })
    ),
    priority: SCENE_PRIORITY.TALK,
    onEnter: [
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.RUMOR_SERIA_RUINS },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.SERIA_BLUE_PULSE },
    ],
    choices: [
      talk('ask_seria_danger', '마력 이상이 위험한 겁니까?'),
      { id: 'seria_end_anomaly', text: '알겠다', action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB } },
    ],
  },
  [STORY_SCENE_ID.SERIA_RUINS_OFFER]: {
    id: STORY_SCENE_ID.SERIA_RUINS_OFFER,
    locationId: village,
    title: '폐허 조사 의뢰',
    narrative:
      '세리아가 숲 쪽을 가리킨다. 말은 짧고, 시선은 빛에 가 있다.',
    npcId: 'seria',
    npcDialogue: '빛은 이미 말했어. 지금은 폐허까지 그 결을 따라가 주면 돼.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'QUEST_STATUS', questId, status: QUEST_STATUS.AVAILABLE }
    ),
    priority: SCENE_PRIORITY.QUEST_CRITICAL,
    choices: [
      {
        id: CHOICE_ACCEPT_RUINS_MYSTERY,
        text: '폐허 조사를 맡는다',
        action: { type: 'ACCEPT_QUEST', questId },
        choicePurpose: 'PROGRESSION',
      },
      move(CHOICE_MOVE_FOREST, '바로 숲길로 나간다', forest),
      move(CHOICE_MOVE_INN, '여관에 들른다', LOCATION_ID.BLUE_MOON_INN),
    ],
  },
  [STORY_SCENE_ID.SERIA_RUINS_ACTIVE]: {
    id: STORY_SCENE_ID.SERIA_RUINS_ACTIVE,
    locationId: village,
    title: '조사 진행',
    narrative: '세리아가 짧게 고개를 끄덕인다.\n“폐허로 이어가면 돼. 제단 앞에서 결을 적어.”',
    npcId: 'seria',
    npcDialogue: '숲을 지나 폐허. 그다음 제단이다.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'QUEST_STATUS', questId, status: QUEST_STATUS.ACTIVE },
      noneOf({ type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID })
    ),
    priority: SCENE_PRIORITY.QUEST,
    choices: [
      {
        id: 'ruins_go_now',
        text: '숲으로 이어간다',
        action: { type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD },
        choicePurpose: 'PROGRESSION',
      },
      move(CHOICE_MOVE_INN, '여관에서 쉰다', LOCATION_ID.BLUE_MOON_INN),
      talk(CHOICE_TALK_RUINS_PROGRESS, '짧게 진행을 이야기한다'),
      {
        id: CHOICE_RECALL_SAVED,
        text: '그때 폐허에서 날 구했던 일을 꺼낸다',
        conditions: { type: 'MEMORY_EXISTS', npcId: 'seria', memoryType: 'PLAYER_SAVED_ME' },
        action: { type: 'TALK', promptId: CHOICE_RECALL_SAVED },
      },
    ],
  },
  [STORY_SCENE_ID.SERIA_RUINS_COMPLETED]: {
    id: STORY_SCENE_ID.SERIA_RUINS_COMPLETED,
    locationId: village,
    title: '조사 완료',
    narrative: '세리아는 의뢰가 끝났다는 것을 안다. 당신의 보고를 기다렸던 표정이 남아 있다.',
    npcId: 'seria',
    npcDialogue: '돌아왔군. 무엇을 발견했지?',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'QUEST_STATUS', questId, status: QUEST_STATUS.COMPLETED }
    ),
    priority: 95,
    choices: [
      talk(CHOICE_ASK_EVENT, '앞으로의 일을 묻는다'),
      move(CHOICE_MOVE_INN, '여관으로 간다', LOCATION_ID.BLUE_MOON_INN),
      look(),
    ],
  },
  [STORY_SCENE_ID.FOREST_ROAD_FIRST]: {
    id: STORY_SCENE_ID.FOREST_ROAD_FIRST,
    locationId: forest,
    title: '숲길',
    narrative: '마을을 벗어나자 나무가 길을 덮는다. 폐허로 이어진다는 오솔길이 희미하다. 수풀 쪽에서 작은 기척이 난다.',
    entryConditions: allOf(loc(forest), { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.FOREST_ROAD_FIRST }),
    priority: SCENE_PRIORITY.FIRST_VISIT,
    choices: [
      {
        id: CHOICE_FIGHT_FOREST_GOBLIN,
        text: '수풀에서 뛰쳐나온 고블린을 맞는다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED }),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'forest_scout_traces',
        text: '흔적을 조사한다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_TRACES_FOUND }),
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.FOREST_TRACES },
        choicePurpose: 'ROLEPLAY',
      },
      investigateForestHerbs(),
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', LOCATION_ID.LUEN_VILLAGE),
    ],
  },
  [STORY_SCENE_ID.FOREST_ROAD_DEFAULT]: {
    id: STORY_SCENE_ID.FOREST_ROAD_DEFAULT,
    locationId: forest,
    title: '숲길',
    narrative: '익숙한 숲길이다. 바람 사이로 석조의 냉기가 느껴진다.',
    entryConditions: loc(forest),
    priority: SCENE_PRIORITY.DEFAULT,
    fallbackSceneId: STORY_SCENE_ID.FOREST_ROAD_DEFAULT,
    choices: [
      {
        id: `${CHOICE_FIGHT_FOREST_GOBLIN}_default`,
        text: '수풀에서 뛰쳐나온 고블린을 맞는다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED }),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'fight_forest_ambush_default',
        text: '수풀의 늑대와 고블린이 길을 막는다',
        conditions: allOf(
          { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED },
          noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_AMBUSH_CLEARED })
        ),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'fight_forest_ambush_again',
        text: '수풀의 늑대와 고블린을 다시 상대한다',
        conditions: { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_AMBUSH_CLEARED },
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH },
        choicePurpose: 'ROLEPLAY',
      },
      {
        id: 'forest_to_ruins_default',
        text: '폐허 입구로 향한다',
        conditions: {
          anyOf: [
            { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_KEY_ACQUIRED },
            { type: 'QUEST_STATUS', questId, status: QUEST_STATUS.COMPLETED },
          ],
        },
        action: { type: 'MOVE_TO_LOCATION', locationId: ruins },
        choicePurpose: 'PROGRESSION',
      },
      investigatePoint(
        'forest_tracks_default',
        '진흙의 발자국을 살핀다',
        EXPLORATION_POINT_ID.FOREST_TRACKS,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_TRACKS })
      ),
      investigatePoint(
        'forest_pack_default',
        '버려진 짐을 살핀다',
        EXPLORATION_POINT_ID.FOREST_ABANDONED_PACK,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_ABANDONED_PACK })
      ),
      investigatePoint(
        'forest_sounds_default',
        '수풀의 기척을 듣는다',
        EXPLORATION_POINT_ID.FOREST_SOUNDS,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_SOUNDS })
      ),
      investigateForestHerbs(),
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', LOCATION_ID.LUEN_VILLAGE),
    ],
  },
  [STORY_SCENE_ID.FOREST_SCOUTS_AFTER]: {
    id: STORY_SCENE_ID.FOREST_SCOUTS_AFTER,
    locationId: forest,
    title: '정찰대를 물리친 뒤',
    narrative:
      '고블린이 쓰러진 자리에 푸른 잔광이 남는다. 발자국은 폐허 쪽으로만 겹친다.\n조직적인 움직임이다. 봉인을 건드린 자가 누구인지는 아직 이 자리만으로는 알 수 없다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.FOREST_SCOUTS_AFTER }
    ),
    priority: 118,
    onEnter: [
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW },
      { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.GOBLIN_MOVEMENT_TRACES },
    ],
    choices: [
      investigatePoint('scout_after_glow', '쓰러진 자리의 푸른 잔광을 살핀다', EXPLORATION_POINT_ID.CAMP_GLOW),
      investigatePoint('scout_after_tracks', '발자국이 이어진 방향을 본다', EXPLORATION_POINT_ID.FOREST_TRACKS),
      {
        id: CHOICE_MOVE_VILLAGE,
        text: '확인한 것을 들고 마을로 돌아간다',
        action: { type: 'MOVE_TO_LOCATION', locationId: village },
        choicePurpose: 'PROGRESSION',
      },
    ],
  },
  [STORY_SCENE_ID.FOREST_DEEPER]: {
    id: STORY_SCENE_ID.FOREST_DEEPER,
    locationId: forest,
    title: '깊은 숲길',
    narrative:
      '길이 좁아지고 푸른 잔광이 발밑까지 내려온다. 안쪽에서 짐승과 활시위 소리가 겹친다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'QUEST_STATUS', questId, status: QUEST_STATUS.ACTIVE },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_AMBUSH_CLEARED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_DEEP_CLEARED }),
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.FOREST_DEEPER },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED })
    ),
    priority: 105,
    onEnter: [{ type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS }],
    choices: [
      investigatePoint(
        'forest_tracks_deeper',
        '진흙의 발자국을 살핀다',
        EXPLORATION_POINT_ID.FOREST_TRACKS,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_TRACKS })
      ),
      investigatePoint(
        'forest_pack_deeper',
        '버려진 짐을 살핀다',
        EXPLORATION_POINT_ID.FOREST_ABANDONED_PACK,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_ABANDONED_PACK })
      ),
      investigatePoint(
        'forest_sounds_deeper',
        '수풀의 기척을 듣는다',
        EXPLORATION_POINT_ID.FOREST_SOUNDS,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_SOUNDS })
      ),
      {
        id: 'fight_forest_deep',
        text: '깊은 숲으로 들어간다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_DEEP },
        choicePurpose: 'PROGRESSION',
      },
    ],
  },
  [STORY_SCENE_ID.FOREST_AMBUSH]: {
    id: STORY_SCENE_ID.FOREST_AMBUSH,
    locationId: forest,
    title: '숲 안쪽의 기척',
    narrative: '활 시위 소리 너머로 늑대 숨이 난다. 고블린만 있는 길이 아니다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_AMBUSH_CLEARED })
    ),
    priority: SCENE_PRIORITY.OPTIONAL_ENCOUNTER,
    choices: [
      {
        id: 'fight_forest_ambush',
        text: '수풀의 늑대와 고블린이 길을 막는다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH },
        choicePurpose: 'PROGRESSION',
      },
      investigatePoint(
        'forest_tracks_ambush',
        '진흙의 발자국을 살핀다',
        EXPLORATION_POINT_ID.FOREST_TRACKS,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.FOREST_TRACKS })
      ),
      {
        id: CHOICE_MOVE_VILLAGE,
        text: '길드에 보고하러 마을로 돌아간다',
        action: { type: 'MOVE_TO_LOCATION', locationId: village },
        choicePurpose: 'PROGRESSION',
      },
    ],
  },
  [STORY_SCENE_ID.FOREST_AMBUSH_AFTER]: {
    id: STORY_SCENE_ID.FOREST_AMBUSH_AFTER,
    locationId: forest,
    title: '매복의 흔적',
    narrative: '궁수가 쓰던 화살과 야영 흔적이 남았다. 길은 폐허 쪽으로 이어진다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_AMBUSH_CLEARED },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.FOREST_AMBUSH_AFTER }
    ),
    priority: 108,
    choices: [
      {
        id: 'fight_forest_deep_after_ambush',
        text: '깊은 숲으로 들어간다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_DEEP_CLEARED }),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_DEEP },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: CHOICE_MOVE_RUINS,
        text: '폐허 입구로 향한다',
        conditions: { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_KEY_ACQUIRED },
        action: { type: 'MOVE_TO_LOCATION', locationId: ruins },
        choicePurpose: 'PROGRESSION',
      },
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
    ],
  },
  [STORY_SCENE_ID.FOREST_CAMP]: {
    id: STORY_SCENE_ID.FOREST_CAMP,
    locationId: forest,
    title: '고블린 야영지',
    narrative: '부러진 나뭇가지와 그을린 자리가 야영지의 흔적이다. 정면으로 들어갈 수도, 주변을 볼 수도 있다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_DEEP_CLEARED },
      { type: 'QUEST_STATUS', questId: QUEST_ID.LEON_GOBLIN_WATCH, status: QUEST_STATUS.ACTIVE },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.GOBLIN_CAMP_CLEARED })
    ),
    priority: SCENE_PRIORITY.SIDE_QUEST_CRITICAL,
    choices: [
      {
        id: 'fight_goblin_camp',
        text: '정면으로 들어간다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_GOBLIN_CAMP },
      },
      {
        id: 'observe_goblin_camp',
        text: '주변을 관찰한다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.GOBLIN_CAMP_OBSERVED }),
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.FOREST_CAMP_OBSERVED },
      },
      move(CHOICE_MOVE_VILLAGE, '지나간다', village),
      look(),
    ],
  },
  [STORY_SCENE_ID.FOREST_CAMP_OBSERVED]: {
    id: STORY_SCENE_ID.FOREST_CAMP_OBSERVED,
    locationId: forest,
    title: '야영지를 살핀다',
    narrative:
      '목책 뒤에서 활을 든 고블린이 자리를 지키고, 가운데는 덩치 큰 그림자가 서성인다. 옆길로 붙으면 진입이 조금 쉽다. 야영지 한쪽에 사람이 그린 듯한 표시가 있다.',
    activation: 'on_talk',
    entryConditions: allOf(
      loc(forest),
      { type: 'QUEST_STATUS', questId: QUEST_ID.LEON_GOBLIN_WATCH, status: QUEST_STATUS.ACTIVE },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.FOREST_CAMP_OBSERVED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.GOBLIN_CAMP_CLEARED })
    ),
    onEnter: [{ type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.GOBLIN_CAMP_OBSERVED, value: true }],
    priority: 146,
    choices: [
      {
        id: 'fight_goblin_camp_flank',
        text: '옆길로 들어간다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_GOBLIN_CAMP },
      },
      move(CHOICE_MOVE_VILLAGE, '지나간다', village),
      look(),
    ],
  },
  [STORY_SCENE_ID.FOREST_CAMP_AFTER]: {
    id: STORY_SCENE_ID.FOREST_CAMP_AFTER,
    locationId: forest,
    title: '야영지 조사',
    narrative: '고블린들이 쓰러진 뒤, 상자·지도 조각·푸른 잔광이 남았다. 지도의 선은 고블린의 손이 아니다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.GOBLIN_CAMP_CLEARED },
      { type: 'QUEST_STATUS', questId: QUEST_ID.LEON_GOBLIN_WATCH, status: QUEST_STATUS.ACTIVE },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.FOREST_CAMP_AFTER }
    ),
    priority: 142,
    choices: [
      investigatePoint('camp_crate', '상자를 조사한다', EXPLORATION_POINT_ID.CAMP_CRATE),
      investigatePoint('camp_map', '지도 조각을 조사한다', EXPLORATION_POINT_ID.CAMP_MAP),
      investigatePoint('camp_glow', '푸른 잔광을 조사한다', EXPLORATION_POINT_ID.CAMP_GLOW),
      { id: CHOICE_INVESTIGATE_AREA, text: '야영지 흔적을 조사한다', action: { type: 'INVESTIGATE', targetId: EXPLORATION_POINT_ID.CAMP_MAP } },
      move(CHOICE_MOVE_VILLAGE, '레온에게 돌아가 보고한다', village),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_ARRIVAL]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_ARRIVAL,
    locationId: ruins,
    title: '고대 폐허',
    narrative:
      '허물어진 석문이 열린다. 문, 조각상, 고블린 흔적, 그리고 차가운 마력이 공기를 무겁게 한다. 석문 옆 덩굴이 최근에 잘려 있고, 이끼 아래 발자국이 아직 말랑하다. 안쪽에서 쇠붙이 소리가 난다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_ARRIVAL },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED })
    ),
    priority: SCENE_PRIORITY.FIRST_VISIT,
    choices: [
      {
        id: CHOICE_FIGHT_RUINS_MIXED,
        text: '입구의 고블린들과 싸운다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE },
        choicePurpose: 'PROGRESSION',
      },
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
      look(),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_ENEMY]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_ENEMY,
    locationId: ruins,
    title: '폐허의 적',
    narrative: '고블린 무리가 제단으로 가는 길을 막고 있다. 지금은 전투를 피할 수 없어 보인다.',
    entryConditions: allOf(loc(ruins), noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED })),
    priority: SCENE_PRIORITY.ENCOUNTER,
    choices: [
      {
        id: CHOICE_FIGHT_RUINS_MIXED,
        text: '고블린과 싸운다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE },
        choicePurpose: 'PROGRESSION',
      },
      investigatePoint(
        'ruins_inscription_enemy',
        '낡은 명문을 읽는다',
        EXPLORATION_POINT_ID.RUINS_OLD_INSCRIPTION,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.RUINS_OLD_INSCRIPTION })
      ),
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
      look(),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY,
    locationId: ruins,
    title: '전투 이후',
    narrative:
      '고블린 무리가 쓰러지고, 폐허 안이 잠시 고요해진다.\n부서진 석상, 낡은 명문, 마력의 잔여. 제단은 더 안쪽에 있다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
      noneOf({ type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID }),
      noneOf({ type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_MAGE }),
      noneOf({ type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_WARRIOR }),
      noneOf({ type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_ROGUE })
    ),
    priority: SCENE_PRIORITY.COMBAT_RESULT,
    choices: [
      {
        id: CHOICE_ENTER_CLASS_MAGE,
        text: '마법석의 잔류 마력을 직접 분석한다',
        conditions: { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.MAGE },
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_MAGE },
      },
      {
        id: CHOICE_ENTER_CLASS_WARRIOR,
        text: '돌을 들어 뒤에 숨겨진 공간을 확인한다',
        conditions: { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.WARRIOR },
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_WARRIOR },
      },
      {
        id: CHOICE_ENTER_CLASS_ROGUE,
        text: '제단 주변의 숨겨진 장치를 찾는다',
        conditions: { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.ROGUE },
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_ROGUE },
      },
      investigatePoint('ruins_inscription', '낡은 명문을 조사한다', EXPLORATION_POINT_ID.RUINS_OLD_INSCRIPTION),
      investigatePoint('ruins_residue', '마력의 잔여를 조사한다', EXPLORATION_POINT_ID.RUINS_MAGIC_RESIDUE),
      investigatePoint('ruins_statue', '부서진 석상을 조사한다', EXPLORATION_POINT_ID.RUINS_BROKEN_STATUE),
      investigateAltar(CHOICE_INVESTIGATE_ALTAR, '제단을 조사한다'),
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_AFTER_DEFEAT]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_AFTER_DEFEAT,
    locationId: ruins,
    title: '패배 이후',
    narrative: '전투에서 밀려났다. 폐허 입구 쪽 그늘에 몸을 숨긴다. 고블린들은 아직 제단을 지키고 있다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_COMBAT_LOST },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED })
    ),
    priority: SCENE_PRIORITY.COMBAT_RESULT,
    fallbackSceneId: STORY_SCENE_ID.ANCIENT_RUINS_ENEMY,
    choices: [
      {
        id: CHOICE_FIGHT_RUINS_MIXED,
        text: '다시 싸운다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE },
      },
      move(CHOICE_MOVE_FOREST, '숲길로 물러난다', forest),
      look(),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_MAGE]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_MAGE,
    locationId: ruins,
    title: '잔류 마력',
    narrative: '제단 위로 희미한 마력이 남아 있다. 훈련된 감각이라면 그 결을 읽을 수 있다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.MAGE },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
      { type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY },
      noneOf({ type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID })
    ),
    priority: SCENE_PRIORITY.CLASS,
    choices: [
      investigateAltar(CHOICE_INVESTIGATE_MAGE, '마법석의 잔류 마력을 직접 분석한다'),
      investigateAltar(CHOICE_INVESTIGATE_ALTAR, '제단을 조사한다'),
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_WARRIOR]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_WARRIOR,
    locationId: ruins,
    title: '숨겨진 공간',
    narrative: '제단을 받친 돌은 생각보다 무겁지 않다. 힘만 있다면 뒤를 확인할 수 있다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.WARRIOR },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
      { type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY },
      noneOf({ type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID })
    ),
    priority: SCENE_PRIORITY.CLASS,
    choices: [
      investigateAltar(CHOICE_INVESTIGATE_WARRIOR, '돌을 들어 뒤에 숨겨진 공간을 확인한다'),
      investigateAltar(CHOICE_INVESTIGATE_ALTAR, '제단을 조사한다'),
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_ROGUE]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_ROGUE,
    locationId: ruins,
    title: '숨겨진 장치',
    narrative: '제단 가장자리에 손때가 다른 홈이 있다. 익숙한 손이라면 장치를 찾을 수 있다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'PLAYER_CLASS', classId: PLAYER_CLASS_ID.ROGUE },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
      { type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY },
      noneOf({ type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID })
    ),
    priority: SCENE_PRIORITY.CLASS,
    choices: [
      investigateAltar(CHOICE_INVESTIGATE_ROGUE, '제단 주변의 숨겨진 장치를 찾는다'),
      investigateAltar(CHOICE_INVESTIGATE_ALTAR, '제단을 조사한다'),
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION,
    locationId: ruins,
    title: '폐허 조사',
    narrative: '제단 주위는 아직 손이 닿지 않은 듯하다. 자세히 살피면 무언가 남을 것이다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
      noneOf({ type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID })
    ),
    priority: 40,
    choices: [
      investigateAltar(CHOICE_INVESTIGATE_ALTAR, '제단을 조사한다'),
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
      look(),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY,
    locationId: ruins,
    title: '왕실 마법석',
    narrative:
      '제단 아래 돌틈에서 차가운 빛이 샌다. 왕실 문장의 마법석이다.\n봉인 주위는 이미 불안정하다. 당신이 처음 연 것이 아니다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_LOST })
    ),
    priority: SCENE_PRIORITY.STORY_FACT_REVEAL,
    choices: [
      {
        id: 'touch_magic_stone',
        text: '마법석에 손을 댄다 — 수호자가 반응한다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED }),
        // Fun Pass: Reveal → Combat in one action (no ENTER_SCENE / on_talk deadlock).
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 },
        effects: [{ type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.TOUCHED_STONE_RASHLY, value: true }],
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'inspect_seal_first',
        text: '훼손 흔적을 확인한 뒤 맞선다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED }),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 },
        effects: [{ type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.RUINS_MAGIC_RESIDUE }],
        choicePurpose: 'PROGRESSION',
      },
      {
        id: 'step_back_altar',
        text: '뒤로 물러난다',
        action: { type: 'MOVE_TO_LOCATION', locationId: forest },
      },
      look(),
    ],
  },
  [STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS]: {
    id: STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS,
    locationId: ruins,
    title: '깨어난 수호자',
    narrative:
      '금이 간 봉인이 흔들린다. 돌과 빛이 일어나며 마력 수호자가 길을 막는다.\n불안정한 시설이 조사에 반응한 것이다.',
    // Must outrank discovery (170) so follow-up resolve cannot kick the player out.
    activation: 'auto',
    entryConditions: allOf(
      loc(ruins),
      { type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
      { type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_LOST })
    ),
    priority: SCENE_PRIORITY.POST_BOSS_CRITICAL,
    choices: [
      {
        id: CHOICE_FIGHT_GUARDIAN,
        text: '고대 수호자에게 맞선다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 },
        choicePurpose: 'PROGRESSION',
      },
      move(CHOICE_MOVE_FOREST, '잠시 물러난다', forest),
      look(),
    ],
  },
  [STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY]: {
    id: STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY,
    locationId: ruins,
    title: '수호자의 소멸',
    narrative:
      '수호자가 쓰러진 자리에 빛이 남은 핵이 굴러 있다.\n봉인 문양은 아직 제단 위에 있다. 누가 먼저 손댔는지는, 직접 봐야 한다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.POST_GUARDIAN_INVESTIGATED })
    ),
    priority: 135,
    choices: [
      {
        id: 'investigate_guardian_core',
        text: '코어를 조사한다',
        action: { type: 'INVESTIGATE', targetId: EXPLORATION_POINT_ID.GUARDIAN_CORE },
        effects: [
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.EVIDENCE_RECORDED },
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.EVIDENCE_RECORDED, value: true },
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.GUARDIAN_NOT_OUR_FAULT },
        ],
      },
      {
        id: 'take_core_fragment',
        text: '수호자 핵의 파편을 하나 가져간다',
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.POST_GUARDIAN_AFTERMATH },
        effects: [
          { type: 'GRANT_ITEM', itemId: ITEM_ID.GUARDIAN_CORE_FRAGMENT, quantity: 1, sourceEventId: 'story:guardian:fragment' },
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.GUARDIAN_FRAGMENT_TAKEN, value: true },
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.GUARDIAN_NOT_OUR_FAULT },
        ],
      },
      {
        id: 'inspect_broken_seal',
        text: '봉인을 살핀다',
        action: { type: 'INVESTIGATE', targetId: EXPLORATION_POINT_ID.BROKEN_SEAL_AFTER },
        effects: [
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.BROKEN_SEAL_DETAIL },
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.BROKEN_SEAL_DETAIL, value: true },
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.GUARDIAN_NOT_OUR_FAULT },
        ],
      },
      {
        id: 'leave_ruins_now',
        text: '더 이상 머물지 않고 바로 나간다',
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.POST_GUARDIAN_AFTERMATH },
        choicePurpose: 'PROGRESSION',
        effects: [
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.LEFT_RUINS_EARLY },
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.LEFT_RUINS_EARLY, value: true },
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.GUARDIAN_NOT_OUR_FAULT },
        ],
      },
    ],
  },
  [STORY_SCENE_ID.POST_GUARDIAN_AFTERMATH]: {
    id: STORY_SCENE_ID.POST_GUARDIAN_AFTERMATH,
    locationId: ruins,
    title: '폐허를 빠져나가며',
    narrative:
      '수호자가 사라진 뒤 폐허의 구조가 불안정해졌다.\n돌 부스러기가 떨어지고, 벽의 마력 무늬가 서서히 꺼져 간다.\n이건 당신이 시작한 일이 아니다. 더 이상 여기 있을 이유는 없다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.POST_GUARDIAN_AFTERMATH }
    ),
    priority: 131,
    choices: [
      move(CHOICE_MOVE_FOREST, '숲길을 통해 마을로 돌아간다', forest),
    ],
    onEnter: [
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.POST_GUARDIAN_INVESTIGATED, value: true },
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.RUINS_ESCAPED, value: true },
    ],
  },
  [STORY_SCENE_ID.FOREST_RETURN_EVENT]: {
    id: STORY_SCENE_ID.FOREST_RETURN_EVENT,
    locationId: forest,
    title: '돌아오는 길',
    narrative:
      '숲이 이상하게 조용하다. 북쪽 하늘에 폐허와 같은 푸른 빛이 한 줄기 보인다. 같은 사건이 북쪽으로 퍼지고 있다.',
    entryConditions: allOf(
      loc(forest),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_ESCAPED },
      noneOf({ type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.FOREST_RETURN_EVENT })
    ),
    priority: 165,
    onEnter: [{ type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.NORTHERN_BLUE_LIGHT }],
    choices: [
      move(CHOICE_MOVE_VILLAGE, '서둘러 루엔으로 돌아간다', village),
      look(),
    ],
  },
  [STORY_SCENE_ID.LUEN_RETURN_REACTION]: {
    id: STORY_SCENE_ID.LUEN_RETURN_REACTION,
    locationId: village,
    title: '무사 귀환',
    narrative: '숲을 빠져나오자 루엔의 익숙한 풍경이 눈에 들어온다.\n마르타가 여관 앞을 지나다 이쪽을 본다.',
    npcId: 'innkeeper',
    npcDialogue: '세상에, 무사히 돌아왔구나. 몰골이 말이 아니네. 여관에서 물약이라도 들이켜.',
    entryConditions: allOf(
      loc(village),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_ESCAPED },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LUEN_RETURN_REACTION }
    ),
    priority: 165,
    choices: [
      {
        id: CHOICE_REPORT_RUINS,
        text: '세리아에게 폐허에서의 일을 보고한다',
        action: { type: 'SHARE_FACT', factId: RUINS_SEAL_FACT_ID, toId: 'seria' },
        conditions: noneOf({ type: 'NPC_KNOWS_FACT', npcId: 'seria', factId: RUINS_SEAL_FACT_ID }),
      },
      talk(CHOICE_TALK_MARTA, '마르타에게 인사한다'),
      move(CHOICE_MOVE_INN, '여관에서 잠시 쉰다', LOCATION_ID.BLUE_MOON_INN),
    ],
    onEnter: [
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.RETURNED_TO_LUEN, value: true },
    ],
  },
  [STORY_SCENE_ID.SERIA_FINAL_REPORT]: {
    id: STORY_SCENE_ID.SERIA_FINAL_REPORT,
    locationId: village,
    title: '세리아의 정리',
    narrative: '세리아가 기다리고 있었다는 듯 다가온다.',
    npcId: 'seria',
    npcDialogue: '네가 적은 결이 중요해. 봉인의 마력과 수호자를 움직인 방향이 다르면, 원인은 하나가 아니야.',
    entryConditions: allOf(
      loc(village),
      { type: 'QUEST_STATUS', questId: QUEST_ID.RUINS_MYSTERY, status: QUEST_STATUS.COMPLETED },
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RETURNED_TO_LUEN },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.SERIA_FINAL_REPORT }
    ),
    priority: 126,
    choices: [
      {
        id: 'report_all',
        text: '조사한 내용을 전부 공개한다',
        // Fun Pass: report → Leon in one beat (skip followup Next-click).
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LEON_CONFRONTATION },
        effects: [
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SERIA_REPORT_FULL, value: true },
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SERIA_FINAL_REPORT, value: true },
          { type: 'RELATIONSHIP_CHANGE', npcId: 'seria', reason: 'PLAYER_SHARED_INFORMATION', sourceEventId: 'story:seria:report_full' },
        ],
        choicePurpose: 'DECISION',
      },
      {
        id: 'report_withhold_evidence',
        text: '수호자와 봉인은 말하되, 파편과 물증은 보류한다',
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LEON_CONFRONTATION },
        effects: [
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SERIA_REPORT_WITHHELD_EVIDENCE, value: true },
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SERIA_FINAL_REPORT, value: true },
        ],
        choicePurpose: 'DECISION',
      },
      {
        id: 'report_human_intrusion',
        text: '인간의 최근 침입 흔적을 강조한다',
        action: { type: 'ENTER_SCENE', sceneId: STORY_SCENE_ID.LEON_CONFRONTATION },
        effects: [
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SERIA_REPORT_HUMAN_INTRUSION, value: true },
          { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SERIA_FINAL_REPORT, value: true },
          { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.RUINS_RECENT_HUMAN_TRACE },
        ],
        choicePurpose: 'DECISION',
      },
    ],
  },
  [STORY_SCENE_ID.SERIA_REPORT_FOLLOWUP]: {
    id: STORY_SCENE_ID.SERIA_REPORT_FOLLOWUP,
    locationId: village,
    title: '세리아의 질문',
    narrative:
      '세리아가 눈을 가늘게 뜬다.\n“누가 먼저 봉인을 건드렸을까. 왕실과 관련이 있다고 보나? 레온은 보고를 원할 거야. 나는 더 조사해야 해.”',
    npcId: 'seria',
    npcDialogue: '나는 더 조사해야 해. 레온은 보고를 원할 거야.',
    // Kept for save compatibility; mainline jumps report → Leon.
    activation: 'on_talk',
    entryConditions: allOf(
      loc(village),
      { type: 'SCENE_VISITED', sceneId: STORY_SCENE_ID.SERIA_FINAL_REPORT },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.SERIA_REPORT_FOLLOWUP },
      { type: 'QUEST_STATUS', questId: QUEST_ID.RUINS_MYSTERY, status: QUEST_STATUS.COMPLETED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.LEON_CONFRONTATION_DONE }),
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.SERIA_FINAL_REPORT })
    ),
    priority: 90,
    onEnter: [{ type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.SERIA_FINAL_REPORT, value: true }],
    choices: [
      talk('seria_follow_who', '먼저 온 자에 대해 이야기한다'),
      talk('seria_follow_danger', '봉인이 아직 위험하다고 말한다'),
      { id: 'seria_follow_done', text: '지금은 여기까지다', action: { type: 'LOOK_AROUND' } },
    ],
  },
  [STORY_SCENE_ID.LEON_CONFRONTATION]: {
    id: STORY_SCENE_ID.LEON_CONFRONTATION,
    locationId: village,
    title: '레온의 등장',
    narrative:
      '레온이 세리아의 말끝을 자르며 다가온다.',
    npcId: 'leon',
    npcDialogue: '새어 나온 게 아니라 끌어낸 거라면? 마법이 저절로 봉인을 열진 않는다. 누군가 손댄 거다.',
    entryConditions: allOf(
      loc(village),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.SERIA_FINAL_REPORT },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.LEON_CONFRONTATION }
    ),
    priority: 128,
    choices: [
      {
        id: 'leon_agree_seria',
        text: '세리아의 조사에 동의한다',
        action: { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.PLAYER_BACKS_SERIA },
        effects: [
          { type: 'RELATIONSHIP_CHANGE', npcId: 'seria', reason: 'PLAYER_SHARED_INFORMATION', sourceEventId: 'story:leon:back_seria' },
        ],
      },
      {
        id: 'leon_agree_report',
        text: '레온의 보고가 먼저라고 생각한다',
        action: { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.PLAYER_BACKS_LEON },
        effects: [
          { type: 'RELATIONSHIP_CHANGE', npcId: 'leon', reason: 'PLAYER_SHARED_INFORMATION', sourceEventId: 'story:leon:back_leon' },
        ],
      },
      {
        id: 'leon_wait_judge',
        text: '아직 판단하기 이르다고 말한다',
        action: { type: 'LEARN_FACT', factId: CHAPTER_FACT_ID.PLAYER_WAITS_TO_JUDGE },
      },
    ],
    onEnter: [
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.LEON_CONFRONTATION_DONE, value: true },
    ],
  },
  [STORY_SCENE_ID.EPILOGUE_INN]: {
    id: STORY_SCENE_ID.EPILOGUE_INN,
    locationId: LOCATION_ID.BLUE_MOON_INN,
    title: '긴 하루의 끝',
    narrative:
      '긴 하루가 저물어 간다.\n마르타가 말없이 따뜻한 국을 내놓는다. 폐허에서 돌아온 사람에게 물은 받지 않겠다는 뜻이다.\n길드에 들르기 전에 몸을 추스를 수 있다.',
    npcId: 'innkeeper',
    npcDialogue: '오늘은 푹 쉬어. 오늘만큼은 돈 받지 않을게.',
    entryConditions: allOf(
      loc(LOCATION_ID.BLUE_MOON_INN),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.LEON_CONFRONTATION_DONE },
      { type: 'QUEST_STATUS', questId: QUEST_ID.RUINS_MYSTERY, status: QUEST_STATUS.COMPLETED },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.EPILOGUE_REST_DONE })
    ),
    // Optional Free Roam rest — no longer gates guild recognition.
    priority: 90,
    choices: [
      { id: CHOICE_REST_INN, text: '여관에서 쉰다', action: { type: 'REST' }, choicePurpose: 'DECISION' },
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
    ],
  },
  [STORY_SCENE_ID.GUILD_RECOGNITION]: {
    id: STORY_SCENE_ID.GUILD_RECOGNITION,
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    title: '공적 인정',
    narrative:
      '도란이 장부를 펼치며 고개를 끄덕인다.\n"폐허까지 다녀온 신입은 드물다. 공적은 인정한다.\n북쪽에서도 같은 푸른 빛이 보인다는 보고가 왔다. 북문으로 가 봐라."',
    npcId: 'guildmaster_doran',
    npcDialogue: '공적은 인정한다. 이제 북문을 확인해라.',
    entryConditions: allOf(
      loc(LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.LEON_CONFRONTATION_DONE },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.GUILD_RECOGNITION }
    ),
    priority: SCENE_PRIORITY.CHAPTER_EPILOGUE,
    choices: [
      {
        id: CHOICE_MOVE_GATE,
        text: '북문으로 간다',
        action: { type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.NORTHERN_GATE },
        choicePurpose: 'PROGRESSION',
      },
      talk(CHOICE_TALK_DORAN, '공적 기록을 확인한다'),
      look(),
    ],
    onEnter: [
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.GUILD_RECOGNITION_DONE, value: true },
      { type: 'DISCOVER_LOCATION', locationId: LOCATION_ID.NORTHERN_GATE },
      // Compatibility for older objective/rest checks — recognition implies the day has turned.
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.EPILOGUE_REST_DONE, value: true },
    ],
  },
  [STORY_SCENE_ID.NORTHERN_GATE_EMERGENCY]: {
    id: STORY_SCENE_ID.NORTHERN_GATE_EMERGENCY,
    locationId: LOCATION_ID.NORTHERN_GATE,
    title: '북문의 긴급 보고',
    narrative:
      '레온이 북문에서 전령과 말한다. 북쪽 초소와 연락이 끊겼다.\n폐허와 같은 색의 푸른 빛이 북쪽 하늘에 남는다. 같은 사건이 북쪽으로 가고 있다.',
    npcId: 'leon',
    npcDialogue: '폐허의 빛과 같다. 다음 발걸음은 북쪽이다.',
    entryConditions: allOf(
      loc(LOCATION_ID.NORTHERN_GATE),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.GUILD_RECOGNITION_DONE },
      { type: 'SCENE_NOT_VISITED', sceneId: STORY_SCENE_ID.NORTHERN_GATE_EMERGENCY }
    ),
    priority: SCENE_PRIORITY.CHAPTER,
    choices: [
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
      talk(CHOICE_TALK_LEON, '레온에게 자세히 묻는다'),
    ],
    onEnter: [
      { type: 'SET_WORLD_FLAG', flagId: WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN, value: true },
    ],
  },
  [STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_DEFEAT]: {
    id: STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_DEFEAT,
    locationId: ruins,
    title: '수호자에게 밀려나다',
    narrative: '수호자의 힘은 예상보다 강했다. 지금 상태로는 다시 도전할 준비가 필요하다.',
    entryConditions: allOf(
      loc(ruins),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_LOST },
      noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED })
    ),
    priority: 175,
    fallbackSceneId: STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENED,
    choices: [
      {
        id: CHOICE_FIGHT_GUARDIAN,
        text: '다시 싸운다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 },
      },
      move(CHOICE_MOVE_FOREST, '숲길로 물러나 준비한다', forest),
      look(),
    ],
  },
  [STORY_SCENE_ID.ANCIENT_RUINS_DEFAULT]: {
    id: STORY_SCENE_ID.ANCIENT_RUINS_DEFAULT,
    locationId: ruins,
    title: '고대 폐허',
    narrative: '허물어진 석조 사이로 바람이 지난다.',
    entryConditions: loc(ruins),
    priority: SCENE_PRIORITY.DEFAULT,
    fallbackSceneId: STORY_SCENE_ID.ANCIENT_RUINS_DEFAULT,
    choices: [
      {
        id: CHOICE_FIGHT_RUINS_MIXED,
        text: '입구의 고블린들과 싸운다',
        conditions: noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED }),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE },
        choicePurpose: 'PROGRESSION',
      },
      {
        id: CHOICE_FIGHT_GUARDIAN,
        text: '수호자에게 도전한다',
        conditions: allOf(
          { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
          noneOf({ type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED })
        ),
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 },
        choicePurpose: 'PROGRESSION',
      },
      investigateAltar(
        CHOICE_INVESTIGATE_ALTAR,
        '제단의 봉인을 살핀다',
        allOf(
          { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
          noneOf({ type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID })
        )
      ),
      investigatePoint(
        'ruins_inscription_default',
        '낡은 명문을 읽는다',
        EXPLORATION_POINT_ID.RUINS_OLD_INSCRIPTION,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.RUINS_OLD_INSCRIPTION })
      ),
      investigatePoint(
        'ruins_residue_default',
        '마력의 잔여를 살핀다',
        EXPLORATION_POINT_ID.RUINS_MAGIC_RESIDUE,
        noneOf({ type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.RUINS_MAGIC_RESIDUE })
      ),
      move(CHOICE_MOVE_FOREST, '숲길로 돌아간다', forest),
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', LOCATION_ID.LUEN_VILLAGE),
    ],
  },
  [STORY_SCENE_ID.SERIA_REPORT_UNKNOWN]: {
    id: STORY_SCENE_ID.SERIA_REPORT_UNKNOWN,
    locationId: village,
    title: '보고',
    narrative: '세리아는 당신이 무언가를 들고 돌아왔다는 것만 안다. 자세한 내용은 아직 그녀의 지식이 아니다.',
    npcId: 'seria',
    npcDialogue: '무언가 발견했어? 표정이 예사롭지 않은데.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'PLAYER_KNOWS_FACT', factId: RUINS_SEAL_FACT_ID },
      noneOf({ type: 'NPC_KNOWS_FACT', npcId: 'seria', factId: RUINS_SEAL_FACT_ID })
    ),
    priority: SCENE_PRIORITY.REPORT,
    choices: [
      {
        id: CHOICE_REPORT_RUINS,
        text: '세리아에게 사실을 알려준다',
        action: { type: 'SHARE_FACT', factId: RUINS_SEAL_FACT_ID, toId: 'seria' },
      },
      move(CHOICE_MOVE_INN, '여관으로 간다', LOCATION_ID.BLUE_MOON_INN),
      talk(CHOICE_ASK_EVENT, '최근 사건을 묻는다'),
    ],
  },
  [STORY_SCENE_ID.SERIA_REPORT_KNOWN]: {
    id: STORY_SCENE_ID.SERIA_REPORT_KNOWN,
    locationId: village,
    title: '공유된 진실',
    narrative: '세리아는 이제 왕실 문장의 마법석을 알고 있다. 그녀의 반응이 한층 날카로워진다.',
    npcId: 'seria',
    npcDialogue: '왕실 문장이 있었다고? …그건 평범한 유물이 아니야.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'NPC_KNOWS_FACT', npcId: 'seria', factId: RUINS_SEAL_FACT_ID }
    ),
    priority: SCENE_PRIORITY.REPORT,
    choices: [
      talk(CHOICE_ASK_EVENT, '앞으로의 일을 묻는다'),
      move(CHOICE_MOVE_INN, '여관으로 간다', LOCATION_ID.BLUE_MOON_INN),
      {
        id: CHOICE_SERIA_SECRET,
        text: '세리아의 속마음을 묻는다',
        conditions: { type: 'RELATIONSHIP_MIN', npcId: 'seria', field: 'trust', value: 50 },
        action: { type: 'TALK', promptId: CHOICE_SERIA_SECRET },
      },
    ],
  },
  [STORY_SCENE_ID.SERIA_HIGH_TRUST]: {
    id: STORY_SCENE_ID.SERIA_HIGH_TRUST,
    locationId: village,
    title: '열린 대화',
    narrative: '세리아의 경계가 많이 풀려 있다. 평소라면 꺼내지 않을 이야기를 할 기색이다.',
    npcId: 'seria',
    npcDialogue: '당신만 믿고 하는 말이야. 나는 한때 왕궁 쪽 일을 가까이서 봤어.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'RELATIONSHIP_MIN', npcId: 'seria', field: 'trust', value: 50 }
    ),
    priority: SCENE_PRIORITY.RELATIONSHIP,
    choices: [
      talk(CHOICE_SERIA_SECRET, '숨겨진 이야기를 듣는다'),
      {
        id: CHOICE_ASK_IDENTITY,
        text: '당신 능력을 인정하는 이유를 묻는다',
        conditions: { type: 'RELATIONSHIP_MIN', npcId: 'seria', field: 'respect', value: 60 },
        action: { type: 'TALK', promptId: CHOICE_ASK_IDENTITY },
      },
      talk(CHOICE_TALK_SERIA, '다른 이야기를 한다'),
    ],
  },
  [STORY_SCENE_ID.SERIA_LOW_TRUST]: {
    id: STORY_SCENE_ID.SERIA_LOW_TRUST,
    locationId: village,
    title: '차가운 대화',
    narrative: '세리아는 거리를 둔다. 필요한 말만 하고 시선을 피한다.',
    npcId: 'seria',
    npcDialogue: '용건만 말해. 길게 이야기할 생각은 없어.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'RELATIONSHIP_MAX', npcId: 'seria', field: 'trust', value: -30 }
    ),
    priority: SCENE_PRIORITY.LOW_TRUST,
    choices: [
      talk(CHOICE_TALK_SERIA, '짧게 용건만 말한다'),
      move(CHOICE_MOVE_INN, '자리를 뜬다', LOCATION_ID.BLUE_MOON_INN),
      look(),
    ],
  },
  [STORY_SCENE_ID.SERIA_FEAR]: {
    id: STORY_SCENE_ID.SERIA_FEAR,
    locationId: village,
    title: '조심스러운 반응',
    narrative: '세리아는 공격적으로 나서기보다 한 발 물러선다. 목소리도 낮아져 있다.',
    npcId: 'seria',
    npcDialogue: '…너무 가까이 오지 마. 필요한 말만 하자.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'RELATIONSHIP_MIN', npcId: 'seria', field: 'fear', value: 60 }
    ),
    priority: SCENE_PRIORITY.FEAR,
    choices: [
      talk(CHOICE_TALK_SERIA, '거리를 유지한 채 말한다'),
      move(CHOICE_MOVE_INN, '자리를 뜬다', LOCATION_ID.BLUE_MOON_INN),
      look(),
    ],
  },
  [STORY_SCENE_ID.SERIA_SAVED_MEMORY]: {
    id: STORY_SCENE_ID.SERIA_SAVED_MEMORY,
    locationId: village,
    title: '구해준 기억',
    narrative: '세리아가 잠시 말을 고른다. 폐허에서 목숨을 빌린 기억이 아직 남아 있다.',
    npcId: 'seria',
    npcDialogue: '그때 네가 오지 않았다면, 나는 여기 없었을지도 몰라.',
    entryConditions: allOf(
      loc(village),
      { type: 'NPC_PRESENT', npcId: 'seria' },
      { type: 'MEMORY_EXISTS', npcId: 'seria', memoryType: 'PLAYER_SAVED_ME' }
    ),
    priority: SCENE_PRIORITY.MEMORY,
    choices: [
      {
        id: CHOICE_RECALL_SAVED,
        text: '그때 폐허에서 날 구했던 일을 꺼낸다',
        action: { type: 'TALK', promptId: CHOICE_RECALL_SAVED },
      },
      talk(CHOICE_TALK_SERIA, '다른 이야기를 한다'),
      look(),
    ],
  },
  [STORY_SCENE_ID.LUEN_SHOP]: {
    id: STORY_SCENE_ID.LUEN_SHOP,
    locationId: LOCATION_ID.LUEN_GENERAL_STORE,
    title: '루엔 잡화점',
    narrative:
      '엘린이 진열대를 정리하며 고개를 든다. 회복 물약과 평범한 무기가 가지런히 놓여 있다.\n가격은 흥정의 여지가 없어 보인다.',
    npcId: 'shopkeeper_elin',
    npcDialogue: '필요한 것만 골라. 값은 적어 둔 그대로야.',
    entryConditions: loc(LOCATION_ID.LUEN_GENERAL_STORE),
    priority: SCENE_PRIORITY.DEFAULT,
    fallbackSceneId: STORY_SCENE_ID.LUEN_SHOP,
    choices: [
      { id: CHOICE_OPEN_SHOP, text: '물건을 살펴본다', action: { type: 'OPEN_SHOP' } },
      talk('talk_elin_here', '엘린에게 말을 건다'),
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
    ],
  },
  [STORY_SCENE_ID.BLUE_MOON_INN]: {
    id: STORY_SCENE_ID.BLUE_MOON_INN,
    locationId: LOCATION_ID.BLUE_MOON_INN,
    title: '푸른달 여관',
    narrative: '따뜻한 불빛과 보리 냄새가 감돈다. 마르타가 카운터를 지키고 있다.',
    npcId: 'innkeeper',
    npcDialogue: '어서 오게. 무슨 일이야?',
    entryConditions: loc(LOCATION_ID.BLUE_MOON_INN),
    priority: SCENE_PRIORITY.DEFAULT,
    fallbackSceneId: STORY_SCENE_ID.BLUE_MOON_INN,
    choices: [
      { id: CHOICE_REST_INN, text: '여관에서 쉰다', action: { type: 'REST' }, choicePurpose: 'DECISION' },
      {
        id: 'accept_marta_parcel_inn',
        text: '잃어버린 짐을 찾아 주겠다고 한다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.MARTA_LOST_PARCEL, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.MARTA_LOST_PARCEL },
        choicePurpose: 'DECISION',
      },
      talk(CHOICE_TALK_MARTA, '마르타에게 말을 건다'),
      move(CHOICE_MOVE_VILLAGE, '마을로 나간다', village),
    ],
  },
  [STORY_SCENE_ID.NORTHERN_GATE]: {
    id: STORY_SCENE_ID.NORTHERN_GATE,
    locationId: LOCATION_ID.NORTHERN_GATE,
    title: '북문',
    narrative: '닫힌 북문 앞에 레온이 서 있다. 먼 길은 아직 열리지 않았다.',
    npcId: 'leon',
    npcDialogue: '용건을 말하게.',
    entryConditions: loc(LOCATION_ID.NORTHERN_GATE),
    priority: SCENE_PRIORITY.DEFAULT,
    fallbackSceneId: STORY_SCENE_ID.NORTHERN_GATE,
    choices: [
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
      {
        id: 'accept_leon_watch_gate',
        text: '고블린 출몰을 조사하겠다고 한다',
        conditions: { type: 'QUEST_STATUS', questId: QUEST_ID.LEON_GOBLIN_WATCH, status: QUEST_STATUS.AVAILABLE },
        action: { type: 'ACCEPT_QUEST', questId: QUEST_ID.LEON_GOBLIN_WATCH },
      },
      talk(CHOICE_TALK_LEON, '레온에게 말을 건다'),
      { id: CHOICE_PASS_GATE, text: '문을 통과한다', action: { type: 'PASS_GATE' } },
    ],
  },
  [STORY_SCENE_ID.CHAPTER_1_COMPLETE]: {
    id: STORY_SCENE_ID.CHAPTER_1_COMPLETE,
    locationId: village,
    title: '제1장 완료',
    narrative:
      '폐허에서 깨어난 것의 정체가 드러났다.\n루엔은 잠시 숨을 고르지만, 북문 너머의 소문은 이미 마을까지 스며들고 있다.\n길드 장부에는 아직 모험가로 적혀 있다. 도란이라면 이제 길을 정할 때라고 말할 것이다.',
    npcId: 'seria',
    npcDialogue: '장부는 아직 모험가야. 도란에게 가면 길을 정할 수 있어.',
    entryConditions: allOf(loc(village), { type: 'WORLD_FLAG', flagId: WORLD_FLAG.CHAPTER_1_COMPLETE }),
    priority: SCENE_PRIORITY.CHAPTER,
    choices: [
      move(CHOICE_MOVE_GUILD, '모험가 길드로 간다', LOCATION_ID.LUEN_ADVENTURERS_GUILD),
      move(CHOICE_MOVE_GATE, '북문으로 향한다', LOCATION_ID.NORTHERN_GATE),
      talk(CHOICE_TALK_SERIA, '세리아와 이야기를 나눈다'),
      move(CHOICE_MOVE_INN, '여관에서 숨을 고른다', LOCATION_ID.BLUE_MOON_INN),
    ],
  },
  [STORY_SCENE_ID.NORTHERN_GATE_HOOK]: {
    id: STORY_SCENE_ID.NORTHERN_GATE_HOOK,
    locationId: LOCATION_ID.NORTHERN_GATE,
    title: '북문의 그림자',
    narrative: '북문 너머에서 이상한 움직임이 보고되고 있다. 레온의 표정은 평소보다 굳어 있다.',
    npcId: 'leon',
    npcDialogue: '북문 너머에서 이상한 움직임이 보고되고 있다. 폐허와 같은 푸른 맥동이다. 아직은 통과할 수 없지만, 대비는 해야 한다.',
    entryConditions: allOf(
      loc(LOCATION_ID.NORTHERN_GATE),
      { type: 'WORLD_FLAG', flagId: WORLD_FLAG.CHAPTER_1_COMPLETE }
    ),
    priority: SCENE_PRIORITY.CHAPTER,
    fallbackSceneId: STORY_SCENE_ID.NORTHERN_GATE_HOOK,
    choices: [
      {
        id: 'hook_hear_rumor',
        text: '북문 너머의 소문을 듣는다',
        action: { type: 'TALK', promptId: 'leon_gate' },
      },
      {
        id: 'hook_back_leon',
        text: '공식 보고 쪽이 맞았다고 말한다',
        conditions: { type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.PLAYER_BACKS_LEON },
        action: { type: 'TALK', promptId: 'leon_royal' },
      },
      {
        id: 'hook_back_seria',
        text: '세리아의 추가 조사가 필요하다고 말한다',
        conditions: { type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.PLAYER_BACKS_SERIA },
        action: { type: 'TALK', promptId: 'leon_seria_view' },
      },
      {
        id: 'hook_wait_judge',
        text: '아직 누구 편도 들지 않았다고 말한다',
        conditions: { type: 'PLAYER_KNOWS_FACT', factId: CHAPTER_FACT_ID.PLAYER_WAITS_TO_JUDGE },
        action: { type: 'TALK', promptId: CHOICE_TALK_LEON },
      },
      move(CHOICE_MOVE_VILLAGE, '마을로 돌아간다', village),
      { id: CHOICE_PASS_GATE, text: '문을 통과한다', action: { type: 'PASS_GATE' } },
    ],
  },
};

export function getStorySceneDefinition(sceneId: string): StorySceneDefinition | null {
  return STORY_SCENES[sceneId] ?? null;
}

export function allStorySceneDefinitions(): StorySceneDefinition[] {
  return Object.values(STORY_SCENES);
}

export function getLocationFallbackSceneId(locationId: string): string {
  return LOCATION_FALLBACK_SCENE_ID[locationId] ?? STORY_SCENE_ID.LUEN_VILLAGE_INTRO;
}
