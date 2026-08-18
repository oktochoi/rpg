import type { GameState } from '../../core/game-state';
import type { FactId } from '../../core/ids';
import type { RelationshipChangeReason, RelationshipRequest } from '../../relationships/relationship-types';
import {
  MEMORY_IMPORTANCE_MAX,
  MEMORY_IMPORTANCE_MIN,
  type MemoryEmotion,
  type MemoryRule,
  type MemoryRuleMap,
  type NPCMemory,
} from './memory-types';

export const MEMORY_RULES: MemoryRuleMap = {
  PLAYER_SAVED_NPC: {
    createMemory: true,
    type: 'PLAYER_SAVED_ME',
    importance: 9,
    emotionalTag: 'GRATITUDE',
  },
  PLAYER_HELPED_NPC: {
    createMemory: true,
    type: 'PLAYER_HELPED_ME',
    importance: 5,
    emotionalTag: 'GRATITUDE',
  },
  PLAYER_THREATENED_NPC: {
    createMemory: true,
    type: 'PLAYER_THREATENED_ME',
    importance: 7,
    emotionalTag: 'FEAR',
  },
  PLAYER_ATTACKED_NPC: {
    createMemory: true,
    type: 'PLAYER_ATTACKED_ME',
    importance: 9,
    emotionalTag: 'ANGER',
  },
  PLAYER_DEFEATED_NPC: {
    createMemory: true,
    type: 'PLAYER_ATTACKED_ME',
    importance: 9,
    emotionalTag: 'ANGER',
  },
  PLAYER_COMPLETED_REQUEST: {
    createMemory: true,
    type: 'SHARED_EXPERIENCE',
    importance: 6,
    emotionalTag: 'GRATITUDE',
  },
  PLAYER_GAVE_GIFT: {
    createMemory: true,
    type: 'PLAYER_GAVE_GIFT',
    importance: 2,
    emotionalTag: 'GRATITUDE',
  },
  PLAYER_KEPT_PROMISE: {
    createMemory: true,
    type: 'PLAYER_KEPT_PROMISE',
    importance: 6,
    emotionalTag: 'TRUST',
  },
  PLAYER_BROKE_PROMISE: {
    createMemory: true,
    type: 'PLAYER_BROKE_PROMISE',
    importance: 9,
    emotionalTag: 'ANGER',
  },
  PLAYER_LIED: {
    createMemory: true,
    type: 'PLAYER_BETRAYED_ME',
    importance: 6,
    emotionalTag: 'SUSPICION',
  },
  PLAYER_INSULTED_NPC: {
    createMemory: true,
    type: 'OTHER',
    importance: 4,
    emotionalTag: 'ANGER',
  },
  PLAYER_SHOWED_SKILL: {
    createMemory: false,
    type: 'PLAYER_SHOWED_SKILL',
    importance: 4,
    emotionalTag: 'RESPECT',
  },
  PLAYER_SHARED_INFORMATION: {
    createMemory: false,
    type: 'IMPORTANT_CONVERSATION',
    importance: 3,
    emotionalTag: 'NEUTRAL',
  },
};

export function clampMemoryImportance(value: number): number {
  return Math.max(MEMORY_IMPORTANCE_MIN, Math.min(MEMORY_IMPORTANCE_MAX, Math.round(value)));
}

export function memorySourceId(sourceEventId: string): string {
  return sourceEventId.startsWith('memory:') ? sourceEventId : `memory:${sourceEventId}`;
}

export function toNpcMemory(
  state: Readonly<GameState>,
  request: RelationshipRequest,
  relatedFactIds: readonly FactId[] = []
): NPCMemory | null {
  const rule = MEMORY_RULES[request.reason];
  if (!rule?.createMemory) {
    return null;
  }
  const npc = state.npcs[request.npcId];
  if (!npc) {
    return null;
  }
  const sourceEventId = memorySourceId(request.sourceEventId);
  return {
    id: `memory_${request.npcId}_${sourceEventId.replace(/[^a-zA-Z0-9]+/g, '_')}`,
    npcId: request.npcId,
    type: rule.type,
    summary: summaryForMemory(npc.name, state.world.currentLocationId, request.reason, rule.emotionalTag),
    relatedFactIds,
    importance: clampMemoryImportance(rule.importance),
    emotionalTag: rule.emotionalTag,
    createdAtTurn: state.world.turn,
    sourceEventId,
  };
}

function summaryForMemory(
  npcName: string,
  locationId: string,
  reason: RelationshipChangeReason,
  emotion: MemoryEmotion
): string {
  const place = locationLabel(locationId);
  const object = objectName(npcName);

  if (reason === 'PLAYER_SAVED_NPC') {
    return `Player가 ${place}에서 ${object} 구했다.`;
  }
  if (reason === 'PLAYER_HELPED_NPC') {
    return `Player가 ${place}에서 ${object} 도왔다.`;
  }
  if (reason === 'PLAYER_THREATENED_NPC') {
    return `Player가 ${object} 협박했다.`;
  }
  if (reason === 'PLAYER_ATTACKED_NPC') {
    return `Player가 ${object} 공격했다.`;
  }
  if (reason === 'PLAYER_DEFEATED_NPC') {
    return `Player가 ${object} 공격하고 쓰러뜨렸다.`;
  }
  if (reason === 'PLAYER_COMPLETED_REQUEST') {
    if (locationId === 'ancient_ruins') {
      return 'Player가 자신의 폐허 조사를 완료해주었다.';
    }
    return `Player가 ${npcName}의 부탁을 해결해주었다.`;
  }
  if (reason === 'PLAYER_GAVE_GIFT') {
    return `Player가 ${object} 선물을 주었다.`;
  }
  if (reason === 'PLAYER_KEPT_PROMISE') {
    return `Player가 ${npcName}와의 약속을 지켰다.`;
  }
  if (reason === 'PLAYER_BROKE_PROMISE') {
    return `Player가 ${npcName}와의 약속을 어겼다.`;
  }
  if (reason === 'PLAYER_LIED') {
    return `Player가 ${object} 속였다.`;
  }
  if (reason === 'PLAYER_INSULTED_NPC') {
    return `Player가 ${object} 모욕했다.`;
  }
  if (emotion === 'RESPECT') {
    return `Player가 ${npcName} 앞에서 실력을 보였다.`;
  }
  return `Player와 ${npcName} 사이에 중요한 일이 있었다.`;
}

function locationLabel(locationId: string): string {
  if (locationId === 'ancient_ruins') {
    return '폐허';
  }
  if (locationId === 'ash_inn') {
    return '여관';
  }
  if (locationId === 'ash_town') {
    return '마을';
  }
  return '그곳';
}

function objectName(npcName: string): string {
  if (npcName === '레온') {
    return '레온을';
  }
  if (npcName === '경비병') {
    return '경비병을';
  }
  return `${npcName}를`;
}

export function ruleForMemoryReason(reason: RelationshipChangeReason): MemoryRule | undefined {
  return MEMORY_RULES[reason];
}
