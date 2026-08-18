import type { NpcId } from '../../game/core/ids';
import type { NpcDialogueContext } from '../../game/npc/dialogue-context';
import type { NPCMemory, NPCMemoryType } from '../../game/npc/memory/memory-types';
import type { NpcKnowledgeEntry } from '../../game/npc/npc-knowledge';
import type { RelationshipState } from '../../game/npc/relationship';
import type { WorldFact } from '../../game/world/facts/world-fact';
import { detectIntent } from './intents';
import type { NpcDialogueIntent, NpcDialogueResponse, NpcDialogueService, NpcEmotion } from '../types';

type ContextReader = (npcId: NpcId, playerInput: string) => NpcDialogueContext | null;

const UNKNOWN_TARGET: NpcDialogueResponse = {
  npcId: 'unknown',
  dialogue: '대화할 수 없는 대상입니다.',
  emotion: 'NEUTRAL',
  usedFactIds: [],
  usedMemoryIds: [],
};

export function createMockNpcDialogueService(readContext: ContextReader): NpcDialogueService {
  return {
    async respond(npcId: NpcId, playerInput: string): Promise<NpcDialogueResponse> {
      const context = readContext(npcId, playerInput);
      if (!context) {
        return { ...UNKNOWN_TARGET, npcId };
      }
      return buildMockResponse(context);
    },
  };
}

function buildMockResponse(context: NpcDialogueContext): NpcDialogueResponse {
  const intent = detectIntent(context.playerInput ?? '');
  const goblin = findKnownGoblinFact(context);
  const wantsOpinion = /생각|어때|평가/.test(context.playerInput ?? '');

  if (intent === 'ASK_GOBLIN') {
    return respondGoblin(context, goblin, wantsOpinion);
  }
  if (intent === 'ASK_RUINS') {
    return respondRuins(context, goblin);
  }
  if (intent === 'ASK_RECENT_EVENT') {
    return respondRecent(context, goblin);
  }
  if (intent === 'ASK_MEMORY') {
    return respondMemory(context);
  }
  if (intent === 'ASK_IDENTITY') {
    return applyTone(context, identityLine(context.npc.id), 'NEUTRAL');
  }
  if (intent === 'ASK_RELATIONSHIP') {
    return respondRelationship(context);
  }
  return applyTone(context, generalLine(context.npc.id), 'NEUTRAL');
}

function findMemory(context: NpcDialogueContext, type: NPCMemoryType): NPCMemory | undefined {
  return context.relevantMemories.find((memory) => memory.type === type);
}

function respondMemory(context: NpcDialogueContext): NpcDialogueResponse {
  const saved = findMemory(context, 'PLAYER_SAVED_ME');
  const helped = findMemory(context, 'PLAYER_HELPED_ME');
  const threatened = findMemory(context, 'PLAYER_THREATENED_ME');
  const attacked = findMemory(context, 'PLAYER_ATTACKED_ME');

  if (saved) {
    return {
      npcId: context.npc.id,
      dialogue: savedMemoryLine(context.npc.id),
      emotion: 'FRIENDLY',
      usedFactIds: [...saved.relatedFactIds],
      usedMemoryIds: [saved.id],
    };
  }
  if (helped) {
    return {
      npcId: context.npc.id,
      dialogue: helpedMemoryLine(context.npc.id),
      emotion: 'FRIENDLY',
      usedFactIds: [...helped.relatedFactIds],
      usedMemoryIds: [helped.id],
    };
  }
  if (threatened) {
    return {
      npcId: context.npc.id,
      dialogue: threatenedMemoryLine(context.npc.id),
      emotion: 'AFRAID',
      usedFactIds: [...threatened.relatedFactIds],
      usedMemoryIds: [threatened.id],
    };
  }
  if (attacked) {
    return {
      npcId: context.npc.id,
      dialogue: attackedMemoryLine(context.npc.id),
      emotion: 'ANGRY',
      usedFactIds: [...attacked.relatedFactIds],
      usedMemoryIds: [attacked.id],
    };
  }
  return {
    npcId: context.npc.id,
    dialogue: unknownMemoryLine(context.npc.id),
    emotion: 'NEUTRAL',
    usedFactIds: [],
    usedMemoryIds: [],
  };
}

function withMemoryLines(context: NpcDialogueContext, line: string): { text: string; ids: string[] } {
  const parts = [line];
  const ids: string[] = [];
  const threatened = findMemory(context, 'PLAYER_THREATENED_ME');
  const attacked = findMemory(context, 'PLAYER_ATTACKED_ME');
  if (threatened) {
    parts.push(threatenedMemoryLine(context.npc.id));
    ids.push(threatened.id);
  } else if (attacked) {
    parts.push(attackedMemoryLine(context.npc.id));
    ids.push(attacked.id);
  }
  return { text: parts.join(' '), ids };
}

function findKnownGoblinFact(context: NpcDialogueContext): { fact: WorldFact; entry?: NpcKnowledgeEntry } | null {
  const fact = context.knownFacts.find(
    (item) => item.type === 'ENEMY_DEFEATED' || item.type === 'COMBAT_WON'
  );
  if (!fact) {
    return null;
  }
  const entry = context.knowledgeEntries.find((item) => item.factId === fact.id);
  return { fact, entry };
}

function respondGoblin(
  context: NpcDialogueContext,
  goblin: { fact: WorldFact; entry?: NpcKnowledgeEntry } | null,
  wantsOpinion: boolean
): NpcDialogueResponse {
  if (!goblin) {
    return applyTone(context, unknownGoblinLine(context.npc.id), 'SUSPICIOUS');
  }

  const usedFactIds = [goblin.fact.id];
  if (goblin.entry?.sourceType === 'TOLD_BY_NPC') {
    const sourceName = goblin.entry.sourceId === 'seria' ? '세리아' : '누군가';
    return applyTone(context, heardGoblinLine(context.npc.id, sourceName), 'CURIOUS', usedFactIds);
  }

  if (wantsOpinion) {
    return applyTone(context, opinionGoblinLine(context.npc.id), emotionForNpc(context.npc.id), usedFactIds);
  }

  return applyTone(context, knownGoblinLine(context.npc.id), emotionForNpc(context.npc.id), usedFactIds);
}

function respondRuins(
  context: NpcDialogueContext,
  goblin: { fact: WorldFact; entry?: NpcKnowledgeEntry } | null
): NpcDialogueResponse {
  const saved = findMemory(context, 'PLAYER_SAVED_ME');
  if (saved && /폐허/.test(saved.summary)) {
    return applyTone(
      context,
      ruinsRescueLine(context.npc.id),
      'FRIENDLY',
      goblin ? [goblin.fact.id] : [],
      [saved.id]
    );
  }
  if (context.npc.id === 'seria') {
    const ruinsQuest = context.relevantQuestStates.find((quest) => quest.id === 'ruins_mystery');
    if (ruinsQuest?.status === 'COMPLETED') {
      return applyTone(context, '돌아왔군. 뭘 발견했지?', 'CURIOUS', goblin ? [goblin.fact.id] : []);
    }
    if (ruinsQuest?.status === 'ACTIVE') {
      return applyTone(context, '아직 폐허에 가지 않은 거야? 이상한 마력의 근원을 확인해 줘.', 'CURIOUS');
    }
    if (ruinsQuest?.status === 'AVAILABLE') {
      return applyTone(context, '폐허에서 이상한 마력이 느껴지고 있어. 네가 조사해줄 수 있을까?', 'CURIOUS');
    }
    const extra = goblin ? ' 고블린이 있던 곳이기도 하지.' : '';
    return applyTone(
      context,
      `조금은. 하지만 좋은 곳은 아니야.${extra}`,
      'CURIOUS',
      goblin ? [goblin.fact.id] : []
    );
  }
  if (context.npc.id === 'leon') {
    if (goblin) {
      return applyTone(context, '폐허 쪽 위협은 보고받은 바 있네.', 'NEUTRAL', [goblin.fact.id]);
    }
    return applyTone(context, '폐허는 치안이 허술하다고 들었네.', 'NEUTRAL');
  }
  if (goblin) {
    return applyTone(context, '폐허? 손님이 그쪽에서 고블린을 잡았다는 이야기도 들렸어.', 'CURIOUS', [
      goblin.fact.id,
    ]);
  }
  return applyTone(context, '폐허? 손님들이 가끔 소문만 들고 오지. 난 직접 본 적 없어.', 'CURIOUS');
}

function respondRecent(
  context: NpcDialogueContext,
  goblin: { fact: WorldFact; entry?: NpcKnowledgeEntry } | null
): NpcDialogueResponse {
  if (!goblin) {
    return applyTone(context, unknownRecentLine(context.npc.id), 'NEUTRAL');
  }
  if (goblin.entry?.sourceType === 'TOLD_BY_NPC') {
    return respondGoblin(context, goblin, false);
  }
  return applyTone(context, knownRecentLine(context.npc.id), 'CURIOUS', [goblin.fact.id]);
}

function respondRelationship(context: NpcDialogueContext): NpcDialogueResponse {
  const saved = findMemory(context, 'PLAYER_SAVED_ME');
  const helped = findMemory(context, 'PLAYER_HELPED_ME');
  const { fear, trust, affection, respect } = context.relationship;
  if (saved) {
    return {
      npcId: context.npc.id,
      dialogue: savedDespiteTrustLine(context.npc.id),
      emotion: 'FRIENDLY',
      usedFactIds: [...saved.relatedFactIds],
      usedMemoryIds: [saved.id],
    };
  }
  if (helped && affection < 0) {
    return {
      npcId: context.npc.id,
      dialogue: helpedDespiteDislikeLine(context.npc.id),
      emotion: 'NEUTRAL',
      usedFactIds: [...helped.relatedFactIds],
      usedMemoryIds: [helped.id],
    };
  }
  if (fear >= 60) {
    return {
      npcId: context.npc.id,
      dialogue: '알겠어. 진정해. 내가 아는 건 말해줄게.',
      emotion: 'AFRAID',
      usedFactIds: [],
      usedMemoryIds: [],
    };
  }
  if (fear >= 15) {
    return {
      npcId: context.npc.id,
      dialogue: fearLine(context.npc.id),
      emotion: 'AFRAID',
      usedFactIds: [],
      usedMemoryIds: [],
    };
  }
  if (trust >= 60) {
    return { npcId: context.npc.id, dialogue: highTrustLine(context.npc.id), emotion: 'FRIENDLY', usedFactIds: [], usedMemoryIds: [] };
  }
  if (trust <= -40) {
    return { npcId: context.npc.id, dialogue: lowTrustLine(context.npc.id), emotion: 'SUSPICIOUS', usedFactIds: [], usedMemoryIds: [] };
  }
  if (affection >= 60) {
    return { npcId: context.npc.id, dialogue: highAffectionLine(context.npc.id), emotion: 'FRIENDLY', usedFactIds: [], usedMemoryIds: [] };
  }
  if (affection <= -50) {
    return { npcId: context.npc.id, dialogue: lowAffectionLine(context.npc.id), emotion: 'ANGRY', usedFactIds: [], usedMemoryIds: [] };
  }
  if (respect >= 8) {
    return { npcId: context.npc.id, dialogue: respectLine(context.npc.id), emotion: 'NEUTRAL', usedFactIds: [], usedMemoryIds: [] };
  }
  return { npcId: context.npc.id, dialogue: '아직은 서로를 판단하는 중이지.', emotion: 'NEUTRAL', usedFactIds: [], usedMemoryIds: [] };
}

function applyTone(
  context: NpcDialogueContext,
  base: string,
  emotion: NpcEmotion,
  usedFactIds: string[] = [],
  extraMemoryIds: string[] = []
): NpcDialogueResponse {
  const memory = withMemoryLines(context, base);
  const dialogue = withRelationshipTone(context.npc.id, context.relationship, memory.text);
  const { fear, trust, affection } = context.relationship;
  return {
    npcId: context.npc.id,
    dialogue,
    emotion: fear >= 15 ? 'AFRAID' : trust <= -40 ? 'SUSPICIOUS' : affection >= 60 ? 'FRIENDLY' : emotion,
    usedFactIds,
    usedMemoryIds: [...extraMemoryIds, ...memory.ids],
  };
}

function withRelationshipTone(npcId: string, relationship: RelationshipState, line: string): string {
  const parts = [line];
  if (relationship.fear >= 60) {
    return `알겠어. 진정해. 내가 아는 건 말해줄게. ${line}`;
  }
  if (relationship.fear >= 15) {
    parts.push(fearLine(npcId));
  }
  if (relationship.trust >= 60) {
    parts.push(highTrustLine(npcId));
  } else if (relationship.trust <= -40) {
    parts.push(lowTrustLine(npcId));
  }
  if (relationship.affection >= 60) {
    parts.push(highAffectionLine(npcId));
  } else if (relationship.affection <= -50) {
    parts.push(lowAffectionLine(npcId));
  } else if (relationship.affection >= 5 && relationship.trust >= 5) {
    parts.push(helpedLine(npcId));
  }
  if (relationship.respect >= 60) {
    parts.push(respectLine(npcId));
  } else if (relationship.respect >= 8 && npcId === 'leon') {
    parts.push(respectLine(npcId));
  }
  return parts.join(' ');
}

function fearLine(npcId: string): string {
  if (npcId === 'seria') {
    return '알겠어. 그렇게까지 할 필요는 없잖아.';
  }
  if (npcId === 'leon') {
    return '무력으로 밀어붙일 필요는 없네.';
  }
  return '진정해. 내가 먼저 손 쓸 생각은 없어.';
}

function helpedLine(npcId: string): string {
  if (npcId === 'seria') {
    return '적어도 네가 쓸모없는 사람은 아니라는 건 알겠어.';
  }
  if (npcId === 'leon') {
    return '도움이 되었다는 건 인정하지.';
  }
  return '덕분에 한결 나아. 고마워.';
}

function savedMemoryLine(npcId: string): string {
  if (npcId === 'seria') {
    return '그 폐허에서 네가 날 구한 건 아직 기억하고 있어.';
  }
  if (npcId === 'leon') {
    return '그때 목숨을 구해준 일은 잊지 않았네.';
  }
  return '그때 날 구해준 거, 아직 기억하고 있어.';
}

function helpedMemoryLine(npcId: string): string {
  if (npcId === 'seria') {
    return '기억하고 있어. 그때 네가 손을 보탰지.';
  }
  if (npcId === 'leon') {
    return '자네가 도와준 일은 기억하고 있네.';
  }
  return '그때 도와준 거 기억하지.';
}

function threatenedMemoryLine(npcId: string): string {
  if (npcId === 'leon') {
    return '지난번처럼 협박할 생각이라면 대화는 여기까지네.';
  }
  if (npcId === 'seria') {
    return '또 협박할 셈이면 더 들을 말 없어.';
  }
  return '다시 위협할 생각이라면 이야기는 끝이야.';
}

function attackedMemoryLine(npcId: string): string {
  if (npcId === 'leon') {
    return '칼을 겨눈 상대와 편하게 이야기할 수는 없네.';
  }
  if (npcId === 'seria') {
    return '날 공격한 일을 그냥 넘기진 않아.';
  }
  return '날 친 일을 잊었을 리 없잖아.';
}

function savedDespiteTrustLine(npcId: string): string {
  if (npcId === 'seria') {
    return '완전히 믿는 건 아니야. 그래도 그때 네가 날 구한 건 잊지 않았어.';
  }
  if (npcId === 'leon') {
    return '자네가 마음에 드는 건 아니네. 하지만 그때 도움받은 빚은 잊지 않았어.';
  }
  return '완전히 믿진 않아. 그래도 구해준 건 기억해.';
}

function helpedDespiteDislikeLine(npcId: string): string {
  if (npcId === 'leon') {
    return '자네가 마음에 드는 건 아니네. 하지만 그때 도움받은 빚은 잊지 않았어.';
  }
  if (npcId === 'seria') {
    return '네가 마음에 드는 건 아니야. 그래도 도움받은 건 잊지 않았어.';
  }
  return '좋아하진 않지만, 그때 도움은 기억해.';
}

function ruinsRescueLine(npcId: string): string {
  if (npcId === 'seria') {
    return '그 폐허에서 네가 날 구한 건 아직 기억하고 있어.';
  }
  if (npcId === 'leon') {
    return '폐허에서 목숨을 구한 일은 아직 생생하네.';
  }
  return '그 폐허에서 있었던 일은 잊지 못했어.';
}

function unknownMemoryLine(npcId: string): string {
  if (npcId === 'seria') {
    return '그런 일을 나와 함께한 기억은 없어.';
  }
  if (npcId === 'leon') {
    return '자네와 그런 일을 겪은 기억은 없네.';
  }
  return '그런 일은 기억나지 않아.';
}

function highAffectionLine(npcId: string): string {
  if (npcId === 'seria') {
    return '너와 이야기하는 시간이 나쁘지 않군.';
  }
  if (npcId === 'leon') {
    return '자네라면 반갑네.';
  }
  return '어서 와. 보고 싶었어.';
}

function lowAffectionLine(npcId: string): string {
  if (npcId === 'seria') {
    return '네 얼굴은 보고 싶지 않아.';
  }
  if (npcId === 'leon') {
    return '지금은 말을 섞고 싶지 않네.';
  }
  return '오늘은 손님으로 보이지 않네.';
}

function respectLine(npcId: string): string {
  if (npcId === 'leon') {
    return '자네의 전투 실력은 인정하겠네.';
  }
  if (npcId === 'seria') {
    return '실력만큼은 인정하지.';
  }
  return '손재주 하나는 알아줘야겠어.';
}

function knownGoblinLine(npcId: string): string {
  if (npcId === 'seria') {
    return '당연히 기억하지. 네가 고블린을 쓰러뜨렸잖아.';
  }
  if (npcId === 'leon') {
    return '위협을 제거했다면 잘한 일이네.';
  }
  return '정말 네가 그 고블린을 잡았다고? 세상에!';
}

function opinionGoblinLine(npcId: string): string {
  if (npcId === 'seria') {
    return '생각보다 실력이 있네. 운만 좋았던 건 아니겠지?';
  }
  if (npcId === 'leon') {
    return '위협을 제거했다면 잘한 일이네.';
  }
  return '정말 네가 그 고블린을 잡았다고? 세상에!';
}

function heardGoblinLine(npcId: string, sourceName: string): string {
  if (npcId === 'leon') {
    return `${sourceName}에게 이야기는 들었네.`;
  }
  if (npcId === 'seria') {
    return `${sourceName}에게 듣긴 했어. 직접 본 것과는 다르지.`;
  }
  return `${sourceName}가 그 소문을 들려줬어. 진짜인지 아닌지는 손님 입에서 듣고 싶지.`;
}

function unknownGoblinLine(npcId: string): string {
  if (npcId === 'seria') {
    return '그 이야기는 내게 없어. 추측으로 말하진 않겠어.';
  }
  if (npcId === 'leon') {
    return '처음 듣는 이야기군. 누가 그런 말을 했지?';
  }
  return '그런 소문은 아직 여관까지 안 들어왔어.';
}

function unknownRecentLine(npcId: string): string {
  if (npcId === 'seria') {
    return '눈에 띄는 변화는 아직 없어.';
  }
  if (npcId === 'leon') {
    return '치안 보고에는 특별한 전과가 없네.';
  }
  return '오늘은 평소랑 비슷해. 손님이 좀 줄긴 했지만.';
}

function knownRecentLine(npcId: string): string {
  if (npcId === 'seria') {
    return '폐허 입구의 고블린은 처리됐지. 그 이상은 아직 몰라.';
  }
  if (npcId === 'leon') {
    return '최근 위협이 하나 제거됐다는 보고는 있네.';
  }
  return '요새 폐허 쪽 소문이 흉흉했어. 네가 관련 있다면 말해봐!';
}

function identityLine(npcId: string): string {
  if (npcId === 'seria') {
    return '세리아다. 마법 연구를 위해 폐허를 조사하지.';
  }
  if (npcId === 'leon') {
    return '레온이라고 하네. 이 지역의 치안을 맡은 기사일세.';
  }
  return '난 마르타야. 이 여관을 지키고 있지.';
}

function generalLine(npcId: string): string {
  if (npcId === 'seria') {
    return '할 말이 있으면 짧게 해. 추측은 필요 없어.';
  }
  if (npcId === 'leon') {
    return '용건을 말하게. 근거 없는 소문은 듣지 않네.';
  }
  return '편하게 말해. 여관 일은 내가 제일 잘 알거든.';
}

function highTrustLine(npcId: string): string {
  if (npcId === 'seria') {
    return '너라면 말해도 되겠지.';
  }
  if (npcId === 'leon') {
    return '자네라면 믿겠네.';
  }
  return '너라면 숨길 거 없지.';
}

function lowTrustLine(npcId: string): string {
  if (npcId === 'seria') {
    return '그걸 왜 네게 말해야 하지?';
  }
  if (npcId === 'leon') {
    return '아직 자네를 신뢰할 근거가 부족하네.';
  }
  return '그런 말은 쉽게 안 하지.';
}

function emotionForNpc(npcId: string): NpcEmotion {
  if (npcId === 'innkeeper') {
    return 'FRIENDLY';
  }
  if (npcId === 'leon') {
    return 'NEUTRAL';
  }
  return 'CURIOUS';
}

export type { NpcDialogueIntent };
