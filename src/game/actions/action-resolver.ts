import type { NpcDialogueResponse } from '../../ai/types';
import type { GameState } from '../core/game-state';
import type { WorldFactType } from '../world/facts/world-fact';
import { getKnownEntity } from './entity-resolver';
import { jobModifier, type ActionResolution, type ActionValidationResult, type ParsedAction } from './action-types';
import { combatIdForAttack } from './action-validator';
import { resolveExplorationForInvestigate } from '../world/exploration/exploration-service';
import { getLocationDefinition } from '../world/locations/location-definitions';

export interface ResolvedFreeAction {
  resolution: ActionResolution;
  combatId?: string;
  gold?: { amount: number; targetId: string };
  itemReceived?: string;
  dialogue?: { npcId: string; playerText: string; npcText: string; usedMemoryIds?: readonly string[] };
  recordPlayerLine: boolean;
  targetNpcId?: string;
  recordFact: WorldFactType | null;
  factKey?: string;
  factTargetIds?: string[];
  moveToLocationId?: string;
  explorationPointId?: string;
  alreadyExplored?: boolean;
  rest?: boolean;
  consumeItemId?: string;
}

export function resolveAction(
  action: ParsedAction,
  validation: ActionValidationResult,
  state: Readonly<GameState>,
  dialogue?: NpcDialogueResponse | null
): ResolvedFreeAction {
  if (!validation.valid && validation.resultType !== 'REQUIRES_COMBAT') {
    return {
      resolution: {
        success: false,
        actionType: action.actionType,
        narrative: narrativeForInvalid(validation),
        nextMode: 'STORY',
      },
      recordPlayerLine: true,
      recordFact: null,
    };
  }

  switch (action.actionType) {
    case 'ASK':
    case 'TALK':
      return resolveTalk(action, state, dialogue);
    case 'ATTACK':
      return {
        resolution: {
          success: true,
          actionType: 'ATTACK',
          narrative: '검이 뽑힌다. 전투가 시작된다.',
          nextMode: 'COMBAT',
        },
        combatId: combatIdForAttack(action.targetId ?? ''),
        recordPlayerLine: true,
        targetNpcId: action.targetId === 'goblin_01' ? undefined : action.targetId,
        recordFact: action.targetId === 'goblin_01' ? null : 'NPC_ATTACKED',
        factKey: action.targetId,
        factTargetIds: action.targetId ? [action.targetId] : [],
      };
    case 'GIVE':
    case 'BRIBE': {
      const amount = action.amount ?? 0;
      const targetId = action.targetId ?? 'unknown';
      return {
        resolution: {
          success: true,
          actionType: action.actionType,
          narrative:
            action.actionType === 'BRIBE'
              ? `금화 ${amount}개를 건네 문을 열어달라고 청한다.`
              : `금화 ${amount}개를 건넨다.`,
          nextMode: 'STORY',
        },
        gold: amount > 0 ? { amount, targetId } : undefined,
        recordPlayerLine: true,
        targetNpcId: targetId,
        recordFact: null,
      };
    }
    case 'STEAL': {
      const itemId = action.itemId ?? getKnownEntity(action.targetId ?? '')?.stealableItemIds[0] ?? 'guard_key';
      return {
        resolution: {
          success: true,
          actionType: 'STEAL',
          narrative: '손이 빠르게 움직인다. 물건을 빼냈다.',
          nextMode: 'STORY',
        },
        itemReceived: itemId,
        recordPlayerLine: true,
        recordFact: 'ITEM_OBTAINED',
        factKey: itemId,
        factTargetIds: action.targetId ? [action.targetId] : [],
      };
    }
    case 'THREATEN':
      return {
        resolution: {
          success: true,
          actionType: 'THREATEN',
          narrative:
            jobModifier(state.player.classId, 'THREATEN') > 0
              ? '낮은 목소리로 위협한다. 상대가 한 발 물러선다.'
              : '위협적인 말을 던진다. 상대는 가만히 바라본다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        targetNpcId: action.targetId,
        recordFact: 'IMPORTANT_EVENT',
        factKey: `threaten_${action.targetId ?? 'unknown'}`,
        factTargetIds: action.targetId ? [action.targetId] : [],
      };
    case 'HELP':
      return {
        resolution: {
          success: true,
          actionType: 'HELP',
          narrative: '당신이 손을 보탠다. 상대가 그 도움을 받아들인다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        targetNpcId: action.targetId,
        recordFact: 'NPC_HELPED',
        factKey: action.targetId ?? 'unknown',
        factTargetIds: action.targetId ? [action.targetId] : [],
      };
    case 'RESCUE':
      return {
        resolution: {
          success: true,
          actionType: 'RESCUE',
          narrative: '당신이 상대를 위험에서 건져낸다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        targetNpcId: action.targetId,
        recordFact: 'IMPORTANT_EVENT',
        factKey: `saved_${action.targetId ?? 'unknown'}`,
        factTargetIds: action.targetId ? [action.targetId] : [],
      };
    case 'INVESTIGATE': {
      const exploration = resolveExplorationForInvestigate(state, action.rawInput, action.targetId);
      if (exploration.point && exploration.alreadyExplored) {
        return {
          resolution: {
            success: true,
            actionType: 'INVESTIGATE',
            narrative: '이미 살펴본 곳이다.',
            nextMode: 'STORY',
          },
          recordPlayerLine: true,
          recordFact: null,
          explorationPointId: exploration.point.id,
          alreadyExplored: true,
        };
      }
      if (exploration.point) {
        return {
          resolution: {
            success: true,
            actionType: 'INVESTIGATE',
            narrative: '폐허 안쪽에서 왕실 문장이 새겨진 마법석을 발견했다.',
            nextMode: 'STORY',
          },
          recordPlayerLine: true,
          recordFact: null,
          explorationPointId: exploration.point.id,
        };
      }
      const alreadyHasKey = state.player.inventory.some((item) => item.itemId === 'strange_key');
      return {
        resolution: {
          success: true,
          actionType: 'INVESTIGATE',
          narrative: alreadyHasKey ? '더 이상 눈에 띄는 것은 없다.' : '책상 아래에서 이상한 열쇠를 발견했다.',
          nextMode: 'STORY',
        },
        itemReceived: alreadyHasKey ? undefined : 'strange_key',
        recordPlayerLine: true,
        recordFact: alreadyHasKey ? 'LOCATION_DISCOVERED' : 'ITEM_OBTAINED',
        factKey: alreadyHasKey ? state.world.currentLocationId : 'strange_key',
      };
    }
    case 'USE_ITEM': {
      const itemId = action.itemId;
      return {
        resolution: {
          success: true,
          actionType: 'USE_ITEM',
          narrative: '물건을 사용한다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        recordFact: null,
        consumeItemId: itemId,
      };
    }
    case 'USE_SKILL':
      return {
        resolution: {
          success: true,
          actionType: 'USE_SKILL',
          narrative: '준비한 재주를 쓴다. 경비가 잠시 시선을 돌린다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        targetNpcId: action.targetId,
        recordFact: null,
      };
    case 'WAIT':
      return {
        resolution: {
          success: true,
          actionType: 'WAIT',
          narrative: '잠시 숨을 고른다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        recordFact: null,
      };
    case 'REST':
      return {
        resolution: {
          success: true,
          actionType: 'REST',
          narrative: '다음 날 아침이 밝았다. 몸과 마음이 한결 가벼워졌다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        recordFact: null,
        rest: true,
      };
    case 'LEAVE':
    case 'MOVE': {
      const locationId = action.targetId;
      const definition = locationId ? getLocationDefinition(locationId) : null;
      if (!locationId || !definition) {
        return {
          resolution: {
            success: false,
            actionType: action.actionType,
            narrative: '그곳으로 가는 길은 아직 알지 못한다.',
            nextMode: 'STORY',
          },
          recordPlayerLine: true,
          recordFact: null,
        };
      }
      return {
        resolution: {
          success: true,
          actionType: 'MOVE',
          narrative: `${definition.name}(으)로 향한다.`,
          nextMode: 'STORY',
        },
        moveToLocationId: locationId,
        recordPlayerLine: true,
        recordFact: null,
      };
    }
    default:
      return {
        resolution: {
          success: false,
          actionType: action.actionType,
          narrative: '그 행동을 할 방법이 떠오르지 않는다.',
          nextMode: 'STORY',
        },
        recordPlayerLine: true,
        recordFact: null,
      };
  }
}

function resolveTalk(
  action: ParsedAction,
  state: Readonly<GameState>,
  dialogue?: NpcDialogueResponse | null
): ResolvedFreeAction {
  const npcId = action.targetId ?? state.story.currentNpcId ?? 'seria';
  if (!dialogue) {
    return {
      resolution: {
        success: false,
        actionType: action.actionType,
        narrative: '대화할 수 없는 대상입니다.',
        nextMode: 'STORY',
      },
      recordPlayerLine: true,
      recordFact: null,
    };
  }

  return {
    resolution: {
      success: true,
      actionType: action.actionType,
      narrative: dialogue.dialogue,
      nextMode: 'STORY',
    },
    dialogue: {
      npcId: dialogue.npcId,
      playerText: action.speech ?? action.rawInput,
      npcText: dialogue.dialogue,
      usedMemoryIds: dialogue.usedMemoryIds,
    },
    recordPlayerLine: false,
    recordFact: null,
  };
}

function narrativeForInvalid(validation: ActionValidationResult): string {
  if (validation.reason === '현재 장소에 해당 대상이 없습니다.') {
    return '현재 장소에 해당 대상이 없습니다.';
  }
  if (validation.reason === '가진 금화가 부족하다.') {
    return '가진 금화가 부족하다.';
  }
  if (validation.reason === '그런 능력은 현재 가지고 있지 않다.') {
    return '그런 능력은 현재 가지고 있지 않다.';
  }
  if (validation.reason === '그곳으로 가는 길은 아직 알지 못한다.') {
    return '그곳으로 가는 길은 아직 알지 못한다.';
  }
  if (validation.reason === '그곳으로 바로 갈 수는 없다.') {
    return '그곳으로 바로 갈 수는 없다.';
  }
  if (validation.resultType === 'UNKNOWN_ACTION') {
    return '그 행동을 할 방법이 떠오르지 않는다.';
  }
  return validation.reason ?? '그 행동을 할 방법이 떠오르지 않는다.';
}
