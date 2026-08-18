import type { GameState } from '../core/game-state';
import { CHAPTER_FACT_ID } from '../knowledge/chapter-1-facts';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { shopStockPhase, SHOP_STOCK_PHASE } from '../economy/shop-stock';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { REPEAT_POLICY, type DialogueTopicDefinition } from './dialogue-topics';
import { recentSemanticKeys } from './dialogue-topic-state';
import { WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { timeGreeting } from '../world/living-luen/atmosphere';

const RECENT_SMALL_TALK = 3;

export function isSmallTalkSemanticKey(key: string): boolean {
  return key.startsWith('SMALL_TALK:');
}

interface SmallTalkLine {
  topicId: string;
  text: string;
  prompt: string;
  available: (state: Readonly<GameState>) => boolean;
}

export function npcContextFingerprint(state: Readonly<GameState>, npcId: string): string {
  const band = relationshipBand(state.relationships[npcId]?.trust ?? 0);
  return [
    npcId,
    state.story.currentChapterId,
    state.world.currentLocationId,
    timeGreeting(state),
    band,
    worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED) ? 'scouts' : '',
    worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED) ? 'camp' : '',
    worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) ? 'guardian' : '',
    worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED) ? 'shop' : '',
  ].join('|');
}

function relationshipBand(trust: number): string {
  if (trust >= 60) {
    return 'warm';
  }
  if (trust >= 30) {
    return 'known';
  }
  return 'stranger';
}

export function smallTalkTopics(state: Readonly<GameState>, npcId: string): DialogueTopicDefinition[] {
  const lines = linesFor(npcId).filter((line) => line.available(state));
  const recent = recentSemanticKeys(state).filter((key) => key.startsWith(`SMALL_TALK:${npcId}:`)).slice(-RECENT_SMALL_TALK);
  const unused = lines.filter((line) => !recent.includes(`SMALL_TALK:${npcId}:${line.topicId}`));
  const pool = unused.length > 0 ? unused : lines.slice(0, 1);
  return pool.slice(0, 2).map((line) => ({
    topicId: line.topicId,
    npcId,
    semanticKey: `SMALL_TALK:${npcId}:${line.topicId}`,
    promptId: line.topicId,
    text: line.text,
    priority: 28,
    repeatPolicy: REPEAT_POLICY.REPEATABLE,
  }));
}

export function smallTalkPrompt(topicId: string): string | null {
  for (const npcId of ['innkeeper', 'leon', 'seria', 'guildmaster_doran', 'shopkeeper_elin']) {
    const match = linesFor(npcId).find((line) => line.topicId === topicId);
    if (match) {
      return match.prompt;
    }
  }
  return null;
}

function linesFor(npcId: string): SmallTalkLine[] {
  if (npcId === 'innkeeper') {
    return MARTA;
  }
  if (npcId === 'leon') {
    return LEON;
  }
  if (npcId === 'seria') {
    return SERIA;
  }
  if (npcId === 'guildmaster_doran') {
    return DORAN;
  }
  if (npcId === 'shopkeeper_elin') {
    return ELIN;
  }
  return [];
}

const MARTA: SmallTalkLine[] = [
  {
    topicId: 'marta_time',
    text: '마르타와 가벼운 안부를 나눈다.',
    prompt: '오늘 하루는 어때요?',
    available: () => true,
  },
  {
    topicId: 'marta_forest_plan',
    text: '숲으로 나갈 생각인지 묻는다.',
    prompt: '오늘도 숲으로 나갈 생각이야?',
    available: (state) => !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED),
  },
  {
    topicId: 'marta_shop_new',
    text: '상점 소문을 듣는다.',
    prompt: '상점 주인이 새 물건을 들여놨다더라.',
    available: (state) => shopStockPhase(state) !== SHOP_STOCK_PHASE.A,
  },
  {
    topicId: 'marta_leon_watch',
    text: '레온 이야기를 듣는다.',
    prompt: '레온이 요즘 북문 쪽을 자주 살핀다.',
    available: (state) => worldFlag(state, WORLD_FLAG.GUILD_REGISTERED),
  },
  {
    topicId: 'marta_forest_quiet',
    text: '숲길이 조용해졌다는 이야기를 듣는다.',
    prompt: '숲길이 조금 조용해졌다던데.',
    available: (state) =>
      doesNpcKnowFact(state, 'innkeeper', CHAPTER_FACT_ID.PUBLIC_GOBLIN_ROAD_CLEARED) ||
      worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED),
  },
  {
    topicId: 'marta_after_return',
    text: '폐허에서 돌아온 뒤의 걱정을 듣는다.',
    prompt: '다친 데는 없지? 여관은 열려 있어.',
    available: (state) => worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED),
  },
];

const LEON: SmallTalkLine[] = [
  {
    topicId: 'leon_duty',
    text: '레온의 짧은 감시를 듣는다.',
    prompt: '문은 아직이다. 숲부터 정리해라.',
    available: (state) => !worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED),
  },
  {
    topicId: 'leon_camp',
    text: '야영지 이후의 경계를 듣는다.',
    prompt: '야영지는 치웠지. 폐허 방향은 따로다.',
    available: (state) => worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED),
  },
  {
    topicId: 'leon_seria_view',
    text: '세리아에 대한 레온의 생각을 듣는다.',
    prompt: '세리아의 연구가 유용한 건 인정한다. 다만 규정은 규정이다.',
    available: () => true,
  },
  {
    topicId: 'leon_gate',
    text: '북문 너머를 묻는다.',
    prompt: '북문 초소 쪽은 아직 소문뿐이다.',
    available: (state) => worldFlag(state, WORLD_FLAG.GUILD_REGISTERED),
  },
  {
    topicId: 'leon_royal',
    text: '왕실 문양에 대한 경계를 듣는다.',
    prompt: '왕실 문양은 함부로 말할 일이 아니다.',
    available: (state) => doesPlayerKnowFact(state, 'fact_information_revealed_ruins_royal_seal'),
  },
];

const SERIA: SmallTalkLine[] = [
  {
    topicId: 'seria_research_aside',
    text: '세리아의 연구 혼잣말을 듣는다.',
    prompt: '기록이 조금 어긋나. 지금은 이 정도만.',
    available: () => true,
  },
  {
    topicId: 'seria_leon_view',
    text: '레온에 대한 세리아의 생각을 듣는다.',
    prompt: '레온은 뭐든 왕실 규정부터 생각하지. 틀린 말은 아니지만.',
    available: () => true,
  },
  {
    topicId: 'seria_camp_ask',
    text: '고블린이 폐허 쪽으로 향했다는 이야기를 한다.',
    prompt: '그 고블린들이 폐허 쪽으로 향했다는 거지?',
    available: (state) =>
      worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED) || doesPlayerKnowFact(state, CHAPTER_FACT_ID.GOBLINS_MOVING_NEAR_RUINS),
  },
  {
    topicId: 'seria_ready',
    text: '폐허 준비 상태를 확인한다.',
    prompt: '준비가 되면 폐허로 가자.',
    available: (state) => state.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.ACTIVE,
  },
  {
    topicId: 'seria_after_report',
    text: '보고 이후의 기록을 듣는다.',
    prompt: '조금 더 기록을 살펴봐야겠어.',
    available: (state) => worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT),
  },
  {
    topicId: 'seria_secret_marker',
    text: '마을 표지석의 문양을 이야기한다.',
    prompt: '그 표지석… 왕실 문양과 닮았어. 네가 본 거 맞지?',
    available: (state) => doesPlayerKnowFact(state, CHAPTER_FACT_ID.SECRET_VILLAGE_ROYAL_MARKER),
  },
];

const DORAN: SmallTalkLine[] = [
  {
    topicId: 'doran_board',
    text: '길드 칠판 이야기를 듣는다.',
    prompt: '칠판을 봐. 없는 의뢰를 붙들고 있진 말고.',
    available: () => true,
  },
  {
    topicId: 'doran_east_road',
    text: '동쪽 길에 대한 소문을 듣는다.',
    prompt: '들리는 이야기로는 동쪽 상단이 늦는대. 확실한 건 아냐.',
    available: (state) => doesPlayerKnowFact(state, CHAPTER_FACT_ID.RUMOR_NORTHERN_TRADE) || worldFlag(state, WORLD_FLAG.GUILD_REGISTERED),
  },
];

const ELIN: SmallTalkLine[] = [
  {
    topicId: 'elin_welcome',
    text: '엘린과 짧게 인사를 나눈다.',
    prompt: '필요한 것만 골라. 빚은 안 받아.',
    available: () => true,
  },
  {
    topicId: 'elin_new_stock',
    text: '새로 들어온 물건을 묻는다.',
    prompt: '이번에 조금 나은 물건이 들어왔어.',
    available: (state) => shopStockPhase(state) !== SHOP_STOCK_PHASE.A,
  },
  {
    topicId: 'elin_ruins_prep',
    text: '폐허 준비용 물건을 묻는다.',
    prompt: '폐허 간다면 물약은 남겨 둬. 검만 믿지 말고.',
    available: (state) => shopStockPhase(state) === SHOP_STOCK_PHASE.C,
  },
];
