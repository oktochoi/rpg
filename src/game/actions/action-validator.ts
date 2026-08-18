import type { GameState } from '../core/game-state';
import { TEST_GOBLIN_COMBAT_ID } from '../story/test-scenes';
import { ACTION_CONFIDENCE, jobModifier, type ActionValidationResult, type ParsedAction } from './action-types';
import { getKnownEntity, isEntityPresent } from './entity-resolver';
import { validateMoveDestination } from '../world/locations/location-rules';
import { canRest } from '../time/day-rules';

export function validateAction(
  action: ParsedAction,
  state: Readonly<GameState>
): ActionValidationResult {
  if (action.confidence < ACTION_CONFIDENCE.limited || action.actionType === 'UNKNOWN') {
    return {
      valid: false,
      resultType: 'UNKNOWN_ACTION',
      reason: '현재 능력으로 수행할 수 없는 행동입니다.',
    };
  }

  switch (action.actionType) {
    case 'ATTACK':
      return validateAttack(action, state);
    case 'ASK':
    case 'TALK':
      return validateTalk(action, state);
    case 'BRIBE':
    case 'GIVE':
      return validateGive(action, state);
    case 'STEAL':
      return validateSteal(action, state);
    case 'THREATEN':
    case 'HELP':
    case 'RESCUE':
      return validatePresentTarget(action, state);
    case 'USE_ITEM':
      return validateUseItem(action, state);
    case 'USE_SKILL':
      return validateUseSkill(action, state);
    case 'INVESTIGATE':
    case 'WAIT':
      return { valid: true, resultType: 'VALID' };
    case 'REST':
      return validateRest(state);
    case 'LEAVE':
    case 'MOVE':
      return validateMove(action, state);
    default:
      return {
        valid: false,
        resultType: 'UNKNOWN_ACTION',
        reason: '현재 능력으로 수행할 수 없는 행동입니다.',
      };
  }
}

function validateAttack(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  if (!action.targetId) {
    return { valid: false, resultType: 'REQUIRES_TARGET', reason: '누구를 공격할지 분명하지 않다.' };
  }
  if (!isEntityPresent(state, action.targetId)) {
    return { valid: false, resultType: 'INVALID', reason: '현재 장소에 해당 대상이 없습니다.' };
  }
  const entity = getKnownEntity(action.targetId);
  if (!entity?.attackable) {
    return { valid: false, resultType: 'INVALID', reason: '그 대상은 공격할 수 없다.' };
  }
  if (state.player.currentHp <= 0) {
    return { valid: false, resultType: 'INVALID', reason: '전투를 시작할 수 없는 상태입니다.' };
  }
  return { valid: true, resultType: 'REQUIRES_COMBAT' };
}

function validateTalk(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  const targetId = action.targetId ?? state.story.currentNpcId;
  if (!targetId) {
    return { valid: false, resultType: 'REQUIRES_TARGET', reason: '누구에게 말할지 분명하지 않다.' };
  }
  if (!state.npcs[targetId]) {
    return { valid: false, resultType: 'INVALID', reason: '대화할 수 없는 대상입니다.' };
  }
  if (!isEntityPresent(state, targetId)) {
    return { valid: false, resultType: 'INVALID', reason: '현재 장소에 해당 대상이 없습니다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

function validateGive(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  if (!action.targetId) {
    return { valid: false, resultType: 'REQUIRES_TARGET', reason: '누구에게 줄지 분명하지 않다.' };
  }
  if (!isEntityPresent(state, action.targetId)) {
    return { valid: false, resultType: 'INVALID', reason: '현재 장소에 해당 대상이 없습니다.' };
  }
  const amount = action.amount ?? 0;
  if (amount <= 0 && !action.itemId) {
    return { valid: false, resultType: 'INVALID', reason: '무엇을 줄지 분명하지 않다.' };
  }
  if (amount > 0 && state.player.gold < amount) {
    return { valid: false, resultType: 'INVALID', reason: '가진 금화가 부족하다.' };
  }
  if (action.itemId && !state.player.inventory.some((item) => item.itemId === action.itemId && item.quantity > 0)) {
    return { valid: false, resultType: 'INVALID', reason: '그런 물건을 가지고 있지 않다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

function validateSteal(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  if (!action.targetId) {
    return { valid: false, resultType: 'REQUIRES_TARGET', reason: '누구에게서 훔칠지 분명하지 않다.' };
  }
  if (!isEntityPresent(state, action.targetId)) {
    return { valid: false, resultType: 'INVALID', reason: '현재 장소에 해당 대상이 없습니다.' };
  }
  const entity = getKnownEntity(action.targetId);
  const itemId = action.itemId ?? entity?.stealableItemIds[0];
  if (!itemId || !entity?.stealableItemIds.includes(itemId)) {
    return { valid: false, resultType: 'INVALID', reason: '훔칠 대상이 없다.' };
  }
  if (jobModifier(state.player.classId, 'STEAL') <= 0) {
    return { valid: false, resultType: 'INVALID', reason: '지금은 훔치는 데 실패했다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

function validatePresentTarget(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  if (!action.targetId) {
    return { valid: false, resultType: 'REQUIRES_TARGET', reason: '대상이 분명하지 않다.' };
  }
  if (!isEntityPresent(state, action.targetId)) {
    return { valid: false, resultType: 'INVALID', reason: '현재 장소에 해당 대상이 없습니다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

function validateUseItem(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  if (!action.itemId) {
    return { valid: false, resultType: 'REQUIRES_TARGET', reason: '어떤 물건을 쓸지 분명하지 않다.' };
  }
  if (!state.player.inventory.some((item) => item.itemId === action.itemId && item.quantity > 0)) {
    return { valid: false, resultType: 'INVALID', reason: '그런 물건을 가지고 있지 않다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

function validateUseSkill(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  const skillId = action.skillId;
  if (!skillId) {
    return { valid: false, resultType: 'INVALID', reason: '그런 능력은 현재 가지고 있지 않다.' };
  }
  const skill = state.player.skills.find((item) => item.id === skillId);
  if (!skill || (skill.usableIn !== 'STORY' && skill.usableIn !== 'BOTH')) {
    return { valid: false, resultType: 'INVALID', reason: '그런 능력은 현재 가지고 있지 않다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

function validateRest(state: Readonly<GameState>): ActionValidationResult {
  const check = canRest(state);
  if (!check.allowed) {
    return { valid: false, resultType: 'INVALID', reason: check.reason ?? '지금은 쉴 수 없습니다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

function validateMove(action: ParsedAction, state: Readonly<GameState>): ActionValidationResult {
  if (!action.targetId) {
    return { valid: false, resultType: 'INVALID', reason: '그곳으로 가는 길은 아직 알지 못한다.' };
  }
  const check = validateMoveDestination(state, action.targetId);
  if (!check.allowed) {
    return { valid: false, resultType: 'INVALID', reason: check.reason ?? '그곳으로 가는 길은 아직 알지 못한다.' };
  }
  return { valid: true, resultType: 'VALID' };
}

export function combatIdForAttack(targetId: string): string {
  if (targetId === 'goblin_01') {
    return TEST_GOBLIN_COMBAT_ID;
  }
  return `combat_duel_${targetId}`;
}

export function isNpcDuelCombatId(combatId: string): boolean {
  return combatId.startsWith('combat_duel_');
}
