import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { ITEM_ID } from '../inventory/item-definitions';
import { QUEST_CATEGORY, QUEST_OBJECTIVE_TYPE, type QuestDefinition } from './quest-types';

export const QUEST_ID = {
  FOREST_GOBLIN_SCOUR: 'forest_goblin_scour',
  FOREST_HERB_GATHER: 'forest_herb_gather',
  RUINS_MYSTERY: 'ruins_mystery',
  KNIGHT_SUSPICION: 'knight_suspicion',
  MARTA_LOST_PARCEL: 'marta_lost_parcel',
  LEON_GOBLIN_WATCH: 'leon_goblin_watch',
} as const;

export const RUINS_SEAL_FACT_ID = 'fact_information_revealed_ruins_royal_seal';
export const RUINS_OFFER_TOPIC = 'ruins_offer';
export const RUINS_REPORT_TOPIC = 'ruins_report';

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  [QUEST_ID.FOREST_GOBLIN_SCOUR]: {
    id: QUEST_ID.FOREST_GOBLIN_SCOUR,
    title: '숲길의 고블린',
    description: '최근 숲길에서 고블린 목격이 늘었다. 길드는 신참에게 주변 정찰을 맡긴다. 숲길을 조사하고, 고블린을 처리한 뒤 보고한다.',
    category: QUEST_CATEGORY.SIDE,
    requesterNpcId: 'guildmaster_doran',
    prerequisites: [{ type: 'WORLD_FLAG', flagId: 'guild_registered' }],
    objectives: [
      {
        id: 'win_scouts',
        type: QUEST_OBJECTIVE_TYPE.WIN_ENCOUNTER,
        description: '숲길의 고블린 정찰대를 물리친다',
        targetId: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
      },
      {
        id: 'report_doran',
        type: QUEST_OBJECTIVE_TYPE.TALK_TO_NPC,
        description: '길드로 돌아가 보고한다',
        targetId: 'guildmaster_doran',
      },
      {
        id: 'scout_forest',
        type: QUEST_OBJECTIVE_TYPE.LEARN_FACT,
        description: '숲길의 흔적을 확인한다',
        requiredFactId: 'fact_forest_tracks',
        optional: true,
      },
    ],
    completionEffects: [
      { type: 'SET_WORLD_FLAG', flagId: 'shop_unlocked', value: true },
      { type: 'SET_WORLD_FLAG', flagId: 'enhancement_unlocked', value: true },
      { type: 'CREATE_WORLD_FACT', factType: 'QUEST_COMPLETED', factId: 'fact_public_goblin_road_cleared', tags: ['public', 'goblin'] },
      { type: 'RELATIONSHIP_CHANGE', npcId: 'guildmaster_doran', reason: 'PLAYER_COMPLETED_REQUEST' },
    ],
    reward: { exp: 20, gold: 30 },
  },
  [QUEST_ID.FOREST_HERB_GATHER]: {
    id: QUEST_ID.FOREST_HERB_GATHER,
    title: '숲길의 약초',
    description: '길드 칠판의 작은 부탁. 숲길 가장자리의 약초를 확인해 오면 된다. 전투는 필요 없다.',
    category: QUEST_CATEGORY.SIDE,
    requesterNpcId: 'guildmaster_doran',
    prerequisites: [{ type: 'WORLD_FLAG', flagId: 'guild_registered' }],
    objectives: [
      {
        id: 'find_herbs',
        type: QUEST_OBJECTIVE_TYPE.LEARN_FACT,
        description: '숲길에서 약초를 확인한다',
        requiredFactId: 'fact_forest_herbs',
      },
    ],
    reward: { exp: 8, gold: 15 },
  },
  [QUEST_ID.RUINS_MYSTERY]: {
    id: QUEST_ID.RUINS_MYSTERY,
    title: '폐허의 이상한 기운',
    description: '세리아가 폐허에서 이상한 마력을 느꼈다. 입구의 위험을 치우고, 내부를 조사한 뒤 돌아와 보고한다.',
    category: QUEST_CATEGORY.MAIN,
    requesterNpcId: 'seria',
    availabilityTriggers: [{ type: 'DIALOGUE_TOPIC', npcId: 'seria', topicId: RUINS_OFFER_TOPIC }],
    objectives: [
      {
        id: 'talk_seria',
        type: QUEST_OBJECTIVE_TYPE.TALK_TO_NPC,
        description: '세리아와 대화하기',
        targetId: 'seria',
        conversationTopicId: RUINS_OFFER_TOPIC,
      },
      {
        id: 'visit_ruins',
        type: QUEST_OBJECTIVE_TYPE.VISIT_LOCATION,
        description: '폐허 방문하기',
        targetId: 'ancient_ruins',
      },
      {
        id: 'win_mixed',
        type: QUEST_OBJECTIVE_TYPE.WIN_ENCOUNTER,
        description: '폐허 입구의 적을 물리친다',
        targetId: ENCOUNTER_ID.CH1_RUINS_GATE,
      },
      {
        id: 'win_guardian',
        type: QUEST_OBJECTIVE_TYPE.WIN_ENCOUNTER,
        description: '고대 수호자 격파',
        targetId: ENCOUNTER_ID.RUINS_BOSS_01,
        optional: true,
      },
      {
        id: 'investigate_ruins',
        type: QUEST_OBJECTIVE_TYPE.INVESTIGATE,
        description: '폐허 조사하기',
        targetId: 'ancient_ruins',
      },
      {
        id: 'report_seria',
        type: QUEST_OBJECTIVE_TYPE.TALK_TO_NPC,
        description: '세리아에게 돌아가기',
        targetId: 'seria',
        conversationTopicId: RUINS_REPORT_TOPIC,
        requiredFactId: RUINS_SEAL_FACT_ID,
      },
    ],
    completionEffects: [
      { type: 'CREATE_WORLD_FACT', factType: 'QUEST_COMPLETED', factId: 'fact_quest_completed_ruins_mystery', tags: ['quest', 'ruins'] },
      { type: 'RELATIONSHIP_CHANGE', npcId: 'seria', reason: 'PLAYER_COMPLETED_REQUEST' },
      { type: 'UNLOCK_QUEST', questId: QUEST_ID.KNIGHT_SUSPICION },
      { type: 'UNLOCK_SCENE', sceneId: 'seria_ruins_completed' },
    ],
    nextQuestIds: [QUEST_ID.KNIGHT_SUSPICION],
    reward: {
      exp: 50,
      gold: 70,
      items: [{ itemId: ITEM_ID.HEALING_POTION, quantity: 2 }],
    },
  },
  [QUEST_ID.KNIGHT_SUSPICION]: {
    id: QUEST_ID.KNIGHT_SUSPICION,
    title: '기사의 의심',
    description: '폐허의 발견이 레온의 귀에 들어가면, 왕궁 쪽 이야기가 열릴 수 있다.',
    category: QUEST_CATEGORY.MAIN,
    requesterNpcId: 'leon',
    prerequisites: [{ type: 'QUEST_COMPLETED', questId: QUEST_ID.RUINS_MYSTERY }],
    objectives: [
      {
        id: 'talk_leon',
        type: QUEST_OBJECTIVE_TYPE.TALK_TO_NPC,
        description: '레온과 대화하기',
        targetId: 'leon',
        conversationTopicId: 'knight_ruins',
      },
    ],
    completionEffects: [{ type: 'CREATE_WORLD_FACT', factType: 'QUEST_COMPLETED', factId: 'fact_quest_completed_knight_suspicion' }],
    reward: { exp: 20, gold: 20 },
  },
  [QUEST_ID.MARTA_LOST_PARCEL]: {
    id: QUEST_ID.MARTA_LOST_PARCEL,
    title: '숲길에 떨어진 짐',
    description: '마르타가 숲길에서 잃어버린 짐을 찾아 달라고 한다.',
    category: QUEST_CATEGORY.SIDE,
    requesterNpcId: 'innkeeper',
    prerequisites: [{ type: 'SCENE_VISITED', sceneId: 'marta_first_meeting' }],
    objectives: [
      {
        id: 'visit_forest',
        type: QUEST_OBJECTIVE_TYPE.VISIT_LOCATION,
        description: '숲길을 살핀다',
        targetId: 'forest_road',
      },
      {
        id: 'find_parcel',
        type: QUEST_OBJECTIVE_TYPE.INVESTIGATE,
        description: '잃어버린 짐을 찾는다',
        targetId: 'forest_road',
      },
    ],
    completionEffects: [{ type: 'RELATIONSHIP_CHANGE', npcId: 'innkeeper', reason: 'PLAYER_COMPLETED_REQUEST' }],
    reward: {
      exp: 20,
      gold: 25,
      items: [{ itemId: ITEM_ID.HEALING_POTION, quantity: 1 }],
    },
  },
  [QUEST_ID.LEON_GOBLIN_WATCH]: {
    id: QUEST_ID.LEON_GOBLIN_WATCH,
    title: '늘어나는 고블린',
    description: '레온이 숲 안쪽 고블린 야영지를 확인해 달라고 한다.',
    category: QUEST_CATEGORY.SIDE,
    requesterNpcId: 'leon',
    prerequisites: [
      { type: 'SCENE_VISITED', sceneId: 'leon_first_meeting' },
      { type: 'QUEST_COMPLETED', questId: QUEST_ID.FOREST_GOBLIN_SCOUR },
    ],
    objectives: [
      {
        id: 'win_camp',
        type: QUEST_OBJECTIVE_TYPE.WIN_ENCOUNTER,
        description: '고블린 야영지를 정리한다',
        targetId: ENCOUNTER_ID.CH1_GOBLIN_CAMP,
      },
      {
        id: 'inspect_camp',
        type: QUEST_OBJECTIVE_TYPE.INVESTIGATE,
        description: '야영지 흔적을 조사한다',
        targetId: 'forest_road',
      },
    ],
    completionEffects: [
      { type: 'CREATE_WORLD_FACT', factType: 'INFORMATION_REVEALED', factId: 'fact_goblins_moving_near_ruins', tags: ['goblin', 'ruins'] },
      { type: 'CREATE_WORLD_FACT', factType: 'QUEST_COMPLETED', factId: 'fact_public_goblin_camp_cleared', tags: ['public', 'goblin'] },
      { type: 'RELATIONSHIP_CHANGE', npcId: 'leon', reason: 'PLAYER_COMPLETED_REQUEST' },
    ],
    reward: { exp: 30, gold: 50 },
  },
};

export function getQuestDefinition(questId: string): QuestDefinition | null {
  return QUEST_DEFINITIONS[questId] ?? null;
}

export function allQuestDefinitions(): readonly QuestDefinition[] {
  return Object.values(QUEST_DEFINITIONS);
}
