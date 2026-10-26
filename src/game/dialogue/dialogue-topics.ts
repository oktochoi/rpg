import type { GameState } from '../core/game-state';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { CHAPTER_FACT_ID } from '../knowledge/chapter-1-facts';
import { doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { isChapterCompleted } from '../story/chapters/chapter-rules';
import { CHAPTER_ID } from '../story/chapters/chapter-types';
import { smallTalkTopics } from './small-talk';
import { PLAYER_CLASS_ID } from '../player/classes/class-types';

export const REPEAT_POLICY = {
  ONCE: 'ONCE',
  UNTIL_STATE_CHANGE: 'UNTIL_STATE_CHANGE',
  REPEATABLE: 'REPEATABLE',
  DAILY: 'DAILY',
} as const;

export type RepeatPolicy = (typeof REPEAT_POLICY)[keyof typeof REPEAT_POLICY];

export const GOBLIN_RUINS_FACT_ID = CHAPTER_FACT_ID.GOBLINS_MOVING_NEAR_RUINS;

export interface DialogueTopicDefinition {
  topicId: string;
  npcId: string;
  semanticKey: string;
  promptId: string;
  text: string;
  priority: number;
  repeatPolicy: RepeatPolicy;
  locationId?: string;
}

export function seriaDialoguePhase(state: Readonly<GameState>): string {
  if (worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE) || !isAdventurerLike(state.player.classId)) {
    return 'POST_ADVANCEMENT';
  }
  if (worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT)) {
    return 'POST_REPORT';
  }
  if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
    return 'POST_GUARDIAN';
  }
  if (doesPlayerKnowFact(state, 'fact_information_revealed_ruins_royal_seal')) {
    return 'PLAYER_FOUND_ROYAL_MARK';
  }
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
  if (ruins?.status === QUEST_STATUS.ACTIVE) {
    return 'RUINS_QUEST_ACTIVE';
  }
  if (ruins?.status === QUEST_STATUS.AVAILABLE || worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
    return 'BEFORE_RUINS_QUEST';
  }
  return 'FIRST_MEETING';
}

export function leonDialoguePhase(state: Readonly<GameState>): string {
  if (worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)) {
    return 'POST_ADVANCEMENT';
  }
  if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
    return 'POST_GUARDIAN';
  }
  if (doesPlayerKnowFact(state, 'fact_information_revealed_ruins_royal_seal')) {
    return 'ROYAL_MARK_DISCOVERED';
  }
  if (worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED) || state.quests[QUEST_ID.LEON_GOBLIN_WATCH]?.status === QUEST_STATUS.COMPLETED) {
    return 'GOBLIN_CAMP_CLEARED';
  }
  if (worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
    return 'GOBLIN_THREAT';
  }
  return 'FIRST_MEETING';
}

export function martaDialoguePhase(state: Readonly<GameState>): string {
  if (worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)) {
    return 'POST_ADVANCEMENT';
  }
  if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
    return 'POST_GUARDIAN';
  }
  if (worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN) || worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
    return 'POST_DANGER';
  }
  if (state.quests[QUEST_ID.MARTA_LOST_PARCEL]?.status === QUEST_STATUS.AVAILABLE || state.quests[QUEST_ID.MARTA_LOST_PARCEL]?.status === QUEST_STATUS.ACTIVE) {
    return 'SIDE_QUEST';
  }
  if (worldFlag(state, WORLD_FLAG.GUILD_REGISTERED) || (state.story.visitedSceneIds ?? []).includes('marta_first_meeting')) {
    return 'PLAYER_FIRST_RETURN';
  }
  return 'FIRST_MEETING';
}

function isAdventurerLike(classId: string): boolean {
  return classId === PLAYER_CLASS_ID.ADVENTURER || classId === 'wanderer';
}

export function npcDialoguePhase(state: Readonly<GameState>, npcId: string): string {
  if (npcId === 'seria') {
    return seriaDialoguePhase(state);
  }
  if (npcId === 'leon') {
    return leonDialoguePhase(state);
  }
  if (npcId === 'innkeeper') {
    return martaDialoguePhase(state);
  }
  if (npcId === 'guildmaster_doran') {
    if (worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE) || !isAdventurerLike(state.player.classId)) {
      return 'POST_ADVANCEMENT';
    }
    if (worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE)) {
      return 'RECOGNITION';
    }
    if (worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
      return 'REGISTERED';
    }
    if (state.world.currentLocationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD) {
      return 'REGISTRATION_AVAILABLE';
    }
    return 'FIRST_MEETING';
  }
  return 'DEFAULT';
}

export function dialogueStateKey(state: Readonly<GameState>, npcId: string): string {
  const quests = Object.values(state.quests)
    .map((quest) => `${quest.id}:${quest.status}`)
    .sort()
    .join(',');
  const facts = [...state.knowledge.knownFactIds].sort().join(',');
  const flags = Object.entries(state.world.flags)
    .filter(([, value]) => value)
    .map(([id]) => id)
    .sort()
    .join(',');
  return [
    npcId,
    npcDialoguePhase(state, npcId),
    state.world.currentLocationId,
    state.world.day ?? 1,
    quests,
    facts,
    flags,
    isChapterCompleted(state, CHAPTER_ID.CHAPTER_1_LUEN_RUINS) ? 'ch1' : 'open',
  ].join('|');
}

export function topicsForNpc(state: Readonly<GameState>, npcId: string): DialogueTopicDefinition[] {
  const phase = npcDialoguePhase(state, npcId);
  let topics: DialogueTopicDefinition[] = [];
  if (npcId === 'seria') {
    topics = seriaTopics(state, phase);
  } else if (npcId === 'leon') {
    topics = leonTopics(state, phase);
  } else if (npcId === 'innkeeper') {
    topics = martaTopics(state, phase);
  } else if (npcId === 'guildmaster_doran') {
    topics = doranTopics(state, phase);
  } else if (npcId === 'shopkeeper_elin') {
    topics = elinTopics(state);
  }
  return [...topics, ...smallTalkTopics(state, npcId)];
}

function elinTopics(state: Readonly<GameState>): DialogueTopicDefinition[] {
  const npcId = 'shopkeeper_elin';
  const topics: DialogueTopicDefinition[] = [
    {
      topicId: 'elin_shop_intro',
      npcId,
      semanticKey: 'TALK:ELIN:SHOP',
      promptId: 'talk_elin_here',
      text: '엘린에게 신참 조언을 듣는다.',
      priority: 70,
      repeatPolicy: REPEAT_POLICY.ONCE,
      locationId: LOCATION_ID.LUEN_GENERAL_STORE,
    },
    {
      topicId: 'elin_shop_prices',
      npcId,
      semanticKey: 'TALK:ELIN:PRICES',
      promptId: 'talk_elin_here',
      text: '가격을 다시 확인한다.',
      priority: 40,
      repeatPolicy: REPEAT_POLICY.DAILY,
      locationId: LOCATION_ID.LUEN_GENERAL_STORE,
    },
  ];
  if (worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED)) {
    topics.push({
      topicId: 'elin_new_stock',
      npcId,
      semanticKey: 'TALK:ELIN:NEW_STOCK',
      promptId: 'talk_elin_stock',
      text: '새로 들어온 물건을 물어본다.',
      priority: 75,
      repeatPolicy: REPEAT_POLICY.ONCE,
      locationId: LOCATION_ID.LUEN_GENERAL_STORE,
    });
  }
  return topics;
}

function seriaTopics(state: Readonly<GameState>, phase: string): DialogueTopicDefinition[] {
  const npcId = 'seria';
  const topics: DialogueTopicDefinition[] = [];
  if (phase === 'FIRST_MEETING' || phase === 'BEFORE_RUINS_QUEST') {
    topics.push({
      topicId: 'seria_first_meeting',
      npcId,
      semanticKey: 'TALK:SERIA:INTRO',
      promptId: 'talk_seria_here',
      text: '세리아에게 인사를 건넨다.',
      priority: 90,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'seria_why_luen',
      npcId,
      semanticKey: 'TALK:SERIA:WHY_LUEN',
      promptId: 'ask_recent_event',
      text: '루엔에 온 이유를 묻는다.',
      priority: 88,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'seria_research',
      npcId,
      semanticKey: 'TALK:SERIA:RESEARCH',
      promptId: 'ask_seria_research',
      text: '무엇을 연구하는지 묻는다.',
      priority: 86,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'seria_why_not_go',
      npcId,
      semanticKey: 'TALK:SERIA:WHY_NOT_GO',
      promptId: 'ask_seria_why_not_go',
      text: '왜 직접 가지 않습니까?',
      priority: 84,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'seria_ruins_background',
      npcId,
      semanticKey: 'TALK:SERIA:RUINS_BACKGROUND',
      promptId: 'ask_ruins',
      text: '폐허의 역사에 대해 묻는다.',
      priority: 95,
      repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
    });
    if (doesPlayerKnowFact(state, CHAPTER_FACT_ID.GOBLINS_MOVING_NEAR_RUINS)) {
      topics.push({
        topicId: 'seria_goblin_before_quest',
        npcId,
        semanticKey: 'TALK:SERIA:GOBLIN_MOVEMENT',
        promptId: 'ask_goblin',
        text: '고블린들이 폐허 쪽으로 이동하는 것을 봤습니다.',
        priority: 100,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
  }
  if (phase === 'RUINS_QUEST_ACTIVE') {
    topics.push({
      topicId: 'seria_ruins_progress',
      npcId,
      semanticKey: 'TALK:SERIA:RUINS_PROGRESS',
      promptId: 'talk_ruins_progress',
      text: '폐허 조사 진행을 이야기한다.',
      priority: 90,
      repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
    });
    topics.push({
      topicId: 'seria_ruins_danger',
      npcId,
      semanticKey: 'TALK:SERIA:DANGER',
      promptId: 'ask_seria_danger',
      text: '위험 요소를 묻는다.',
      priority: 80,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'seria_feel_danger',
      npcId,
      semanticKey: 'TALK:SERIA:FEEL_DANGER',
      promptId: 'talk_seria_feel_danger',
      text: '문양을 처음 봤을 때 위험하다고 느꼈다고 말한다.',
      priority: 72,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'seria_feel_curious',
      npcId,
      semanticKey: 'TALK:SERIA:FEEL_CURIOUS',
      promptId: 'talk_seria_feel_curious',
      text: '문양을 처음 봤을 때 흥미로웠다고 말한다.',
      priority: 71,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'seria_feel_royal',
      npcId,
      semanticKey: 'TALK:SERIA:FEEL_ROYAL',
      promptId: 'talk_seria_feel_royal',
      text: '문양이 왕실과 관련 있을 것 같다고 말한다.',
      priority: 70,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    if (doesPlayerKnowFact(state, GOBLIN_RUINS_FACT_ID) || doesPlayerKnowFact(state, CHAPTER_FACT_ID.GOBLIN_MOVEMENT_TRACES)) {
      topics.push({
        topicId: 'seria_goblin_movement',
        npcId,
        semanticKey: 'TALK:SERIA:GOBLIN_MOVEMENT',
        promptId: 'ask_goblin',
        text: '고블린이 폐허 쪽으로 몰린다는 사실을 전한다.',
        priority: 100,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
  }
  if (phase === 'PLAYER_FOUND_ROYAL_MARK' || phase === 'POST_GUARDIAN' || phase === 'POST_REPORT') {
    topics.push({
      topicId: 'seria_ruins_report',
      npcId,
      semanticKey: 'TALK:SERIA:REPORT',
      promptId: 'talk_ruins_progress',
      text: '폐허에서 본 것을 보고한다.',
      priority: 110,
      repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
    });
  }
  if (phase === 'POST_ADVANCEMENT') {
    topics.push({
      topicId: 'seria_post_advancement',
      npcId,
      semanticKey: 'TALK:SERIA:POST_ADVANCEMENT',
      promptId: 'talk_seria_here',
      text: '전직한 뒤의 소감을 나눈다.',
      priority: 80,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
  }
  return topics;
}

function leonTopics(state: Readonly<GameState>, phase: string): DialogueTopicDefinition[] {
  const npcId = 'leon';
  const topics: DialogueTopicDefinition[] = [];
  if (phase === 'FIRST_MEETING' || phase === 'GOBLIN_THREAT') {
    topics.push({
      topicId: 'leon_first_meeting',
      npcId,
      semanticKey: 'TALK:LEON:INTRO',
      promptId: 'talk_leon_here',
      text: '레온에게 북문 경계를 묻는다.',
      priority: 85,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'leon_safety',
      npcId,
      semanticKey: 'TALK:LEON:SAFETY',
      promptId: 'talk_leon_here',
      text: '마을 치안을 묻는다.',
      priority: 80,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'leon_report_first',
      npcId,
      semanticKey: 'TALK:LEON:REPORT_FIRST',
      promptId: 'leon_seria_view',
      text: '왕실 흔적이면 보고가 먼저라고 듣는다.',
      priority: 92,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'leon_goblin_threat',
      npcId,
      semanticKey: 'TALK:LEON:GOBLIN_THREAT',
      promptId: 'ask_recent_event',
      text: '고블린 위협에 대해 듣는다.',
      priority: 90,
      repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
    });
    topics.push({
      topicId: 'leon_honest_report',
      npcId,
      semanticKey: 'TALK:LEON:HONEST',
      promptId: 'talk_leon_honest',
      text: '본 것을 숨기지 않고 보고한다.',
      priority: 78,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    if (doesPlayerKnowFact(state, CHAPTER_FACT_ID.RUMOR_GOBLINS_INCREASING)) {
      topics.push({
        topicId: 'leon_goblin_rumor',
        npcId,
        semanticKey: 'TALK:LEON:GOBLIN_RUMOR',
        promptId: 'talk_leon_goblin_rumor',
        text: '숲길 고블린 이야기를 들었습니다.',
        priority: 100,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
    if (doesPlayerKnowFact(state, CHAPTER_FACT_ID.GOBLIN_MOVEMENT_TRACES) || doesPlayerKnowFact(state, CHAPTER_FACT_ID.FOREST_TRACKS)) {
      topics.push({
        topicId: 'leon_movement_traces',
        npcId,
        semanticKey: 'TALK:LEON:MOVEMENT',
        promptId: 'talk_leon_here',
        text: '고블린의 이동 흔적을 전한다.',
        priority: 102,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
  }
  if (phase === 'GOBLIN_CAMP_CLEARED') {
    topics.push({
      topicId: 'leon_camp_report',
      npcId,
      semanticKey: 'TALK:LEON:CAMP_REPORT',
      promptId: 'talk_leon_here',
      text: '고블린 야영지 조사를 보고한다.',
      priority: 100,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
  }
  if (phase === 'ROYAL_MARK_DISCOVERED' || phase === 'POST_GUARDIAN') {
    topics.push({
      topicId: 'leon_royal_mark',
      npcId,
      semanticKey: 'TALK:LEON:ROYAL_MARK',
      promptId: 'talk_leon_here',
      text: '폐허에서 본 문양에 대해 이야기한다.',
      priority: 105,
      repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
    });
  }
  if (phase === 'POST_ADVANCEMENT') {
    topics.push({
      topicId: 'leon_post_advancement',
      npcId,
      semanticKey: 'TALK:LEON:POST_ADVANCEMENT',
      promptId: 'talk_leon_here',
      text: '전직을 마친 뒤 북문 소문을 듣는다.',
      priority: 90,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
  }
  return topics;
}

function martaTopics(state: Readonly<GameState>, phase: string): DialogueTopicDefinition[] {
  const npcId = 'innkeeper';
  const topics: DialogueTopicDefinition[] = [];
  if (phase === 'FIRST_MEETING') {
    topics.push({
      topicId: 'marta_first_meeting',
      npcId,
      semanticKey: 'TALK:MARTA:INTRO',
      promptId: 'talk_marta_here',
      text: '루엔에 처음 왔다고 말한다.',
      priority: 90,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    topics.push({
      topicId: 'marta_guild_hint',
      npcId,
      semanticKey: 'TALK:MARTA:GUILD',
      promptId: 'talk_marta_here',
      text: '길드 위치를 묻는다.',
      priority: 80,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
  }
  if (phase === 'PLAYER_FIRST_RETURN' || phase === 'SIDE_QUEST') {
    topics.push({
      topicId: 'marta_return',
      npcId,
      semanticKey: 'TALK:MARTA:RETURN',
      promptId: 'talk_marta_here',
      text: '마르타에게 최근 소문을 묻는다.',
      priority: 70,
      repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
    });
    if (worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED)) {
      topics.push({
        topicId: 'marta_shop_hint',
        npcId,
        semanticKey: 'TALK:MARTA:SHOP',
        promptId: 'talk_marta_here',
        text: '장비 점검에 대한 조언을 듣는다.',
        priority: 80,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
    if (state.quests[QUEST_ID.MARTA_LOST_PARCEL]?.status === QUEST_STATUS.COMPLETED) {
      topics.push({
        topicId: 'marta_thanks',
        npcId,
        semanticKey: 'TALK:MARTA:THANKS',
        promptId: 'talk_marta_here',
        text: '짐을 찾아 준 뒤의 인사를 나눈다.',
        priority: 85,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
    if (worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED)) {
      topics.push({
        topicId: 'marta_forest_quiet',
        npcId,
        semanticKey: 'TALK:MARTA:FOREST_QUIET',
        promptId: 'talk_marta_here',
        text: '숲길이 조금 조용해졌다는 이야기를 듣는다.',
        priority: 76,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
  }
  if (phase === 'POST_DANGER' || phase === 'POST_GUARDIAN') {
    topics.push({
      topicId: 'marta_post_danger',
      npcId,
      semanticKey: 'TALK:MARTA:POST_DANGER',
      promptId: 'talk_marta_here',
      text: '폐허에서 돌아온 일을 이야기한다.',
      priority: 95,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
    if (state.quests[QUEST_ID.MARTA_LOST_PARCEL]?.status === QUEST_STATUS.COMPLETED) {
      topics.push({
        topicId: 'marta_warm_return',
        npcId,
        semanticKey: 'TALK:MARTA:WARM_RETURN',
        promptId: 'talk_marta_here',
        text: '짐을 도와준 사람에게 마르타가 더 따뜻하게 맞는다.',
        priority: 96,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
  }
  if (state.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.ACTIVE) {
    topics.push({
      topicId: 'marta_worry_ruins',
      npcId,
      semanticKey: 'TALK:MARTA:WORRY_RUINS',
      promptId: 'marta_worry_ruins',
      text: '폐허로 떠나기 전에 마르타와 이야기한다.',
      priority: 82,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
  }
  if (phase === 'POST_ADVANCEMENT') {
    topics.push({
      topicId: 'marta_post_advancement',
      npcId,
      semanticKey: 'TALK:MARTA:POST_ADVANCEMENT',
      promptId: 'talk_marta_here',
      text: '전직한 모습을 보여 준다.',
      priority: 80,
      repeatPolicy: REPEAT_POLICY.ONCE,
    });
  }
  return topics;
}

function doranTopics(state: Readonly<GameState>, phase: string): DialogueTopicDefinition[] {
  const npcId = 'guildmaster_doran';
  if (phase === 'FIRST_MEETING' || phase === 'REGISTRATION_AVAILABLE') {
    return [
      {
        topicId: 'doran_welcome',
        npcId,
        semanticKey: 'TALK:DORAN:WELCOME',
        promptId: 'talk_doran_here',
        text: '길드 분위기를 묻는다.',
        priority: 70,
        repeatPolicy: REPEAT_POLICY.ONCE,
      },
    ];
  }
  if (phase === 'REGISTERED') {
    const topics: DialogueTopicDefinition[] = [
      {
        topicId: 'doran_first_job',
        npcId,
        semanticKey: 'TALK:DORAN:FIRST_JOB',
        promptId: 'talk_doran_here',
        text: '도란에게 첫 의뢰를 부탁한다.',
        priority: 95,
        repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
      },
      {
        topicId: 'doran_goblin_count',
        npcId,
        semanticKey: 'TALK:DORAN:GOBLIN_COUNT',
        promptId: 'ask_quest_goblin_count',
        text: '고블린이 몇 마리나 있는지 묻는다.',
        priority: 80,
        repeatPolicy: REPEAT_POLICY.ONCE,
      },
      {
        topicId: 'doran_goblin_danger',
        npcId,
        semanticKey: 'TALK:DORAN:GOBLIN_DANGER',
        promptId: 'ask_quest_goblin_danger',
        text: '위험한지 묻는다.',
        priority: 78,
        repeatPolicy: REPEAT_POLICY.ONCE,
      },
    ];
    return topics;
  }
  if (phase === 'RECOGNITION') {
    const topics: DialogueTopicDefinition[] = [
      {
        topicId: 'doran_advancement',
        npcId,
        semanticKey: 'TALK:DORAN:ADVANCEMENT',
        promptId: 'talk_doran_here',
        text: '앞으로의 길을 상의한다.',
        priority: 110,
        repeatPolicy: REPEAT_POLICY.UNTIL_STATE_CHANGE,
      },
      {
        topicId: 'doran_path_warrior',
        npcId,
        semanticKey: 'TALK:DORAN:PATH_WARRIOR',
        promptId: 'ask_path_warrior',
        text: '검사는 어떤 길입니까?',
        priority: 90,
        repeatPolicy: REPEAT_POLICY.ONCE,
      },
      {
        topicId: 'doran_path_mage',
        npcId,
        semanticKey: 'TALK:DORAN:PATH_MAGE',
        promptId: 'ask_path_mage',
        text: '마법사는 어떤 길입니까?',
        priority: 89,
        repeatPolicy: REPEAT_POLICY.ONCE,
      },
      {
        topicId: 'doran_path_rogue',
        npcId,
        semanticKey: 'TALK:DORAN:PATH_ROGUE',
        promptId: 'ask_path_rogue',
        text: '도적은 어떤 길입니까?',
        priority: 88,
        repeatPolicy: REPEAT_POLICY.ONCE,
      },
    ];
    if (state.quests[QUEST_ID.LEON_GOBLIN_WATCH]?.status === QUEST_STATUS.COMPLETED) {
      topics.push({
        topicId: 'doran_camp_mention',
        npcId,
        semanticKey: 'TALK:DORAN:CAMP',
        promptId: 'talk_doran_here',
        text: '숲길 문제까지 처리한 이야기를 듣는다.',
        priority: 100,
        repeatPolicy: REPEAT_POLICY.ONCE,
      });
    }
    return topics;
  }
  return [
    {
      topicId: 'doran_post',
      npcId,
      semanticKey: 'TALK:DORAN:POST',
      promptId: 'talk_doran_here',
      text: '도란과 짧게 인사를 나눈다.',
      priority: 40,
      repeatPolicy: REPEAT_POLICY.DAILY,
    },
  ];
}
