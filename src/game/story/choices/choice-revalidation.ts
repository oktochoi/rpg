import type { GameState } from '../../core/game-state';
import { validateAction } from '../../actions/action-validator';
import type { ParsedAction } from '../../actions/action-types';
import { actorKnowsFact, doesNpcKnowFact } from '../../knowledge/knowledge-selectors';
import { isNpcAtCurrentLocation } from '../../world/locations/location-selectors';
import { validateMoveToLocation } from '../../world/locations/location-rules';
import { isStartableCombatId } from '../../combat/encounters/encounter-definitions';
import { findAvailableChoiceDefinition } from '../story-choice-service';
import { getTalkPrompt } from '../../npc/talk-choices';
import type { ChoiceCandidate } from './choice-types';
import { CHOICE_INTENT } from './choice-types';
import { buildStoryDirectorContext } from './director-context-builder';
import { buildChoiceCandidates } from './choice-candidate-builder';

export function liveCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  if (state.mode === 'COMBAT') {
    return [];
  }
  const context = buildStoryDirectorContext(state);
  return buildChoiceCandidates(state, context);
}

export function findLiveCandidate(state: Readonly<GameState>, candidateId: string): ChoiceCandidate | null {
  return liveCandidates(state).find((candidate) => candidate.id === candidateId) ?? null;
}

export function revalidateCandidate(
  state: Readonly<GameState>,
  candidate: ChoiceCandidate
): { ok: true } | { ok: false; reason: string } {
  if (state.mode === 'COMBAT' || state.mode === 'RESOLVING') {
    return { ok: false, reason: '지금은 선택지를 고를 수 없습니다.' };
  }

  const storyChoiceId = candidate.metadata?.storyChoiceId;
  if (storyChoiceId && !findAvailableChoiceDefinition(state, storyChoiceId) && isStoryLockedAction(candidate)) {
    return { ok: false, reason: '지금은 그 행동을 할 수 없다.' };
  }

  if (candidate.actionType === 'MOVE') {
    const locationId = candidate.metadata?.locationId ?? candidate.targetId;
    if (!locationId) {
      return { ok: false, reason: '그곳으로 가는 길은 아직 알지 못한다.' };
    }
    const move = validateMoveToLocation(state, locationId);
    if (!move.allowed) {
      return { ok: false, reason: move.reason ?? '지금은 이동할 수 없습니다.' };
    }
    return { ok: true };
  }

  if (candidate.actionType === 'ATTACK') {
    const combatId = candidate.metadata?.encounterId ?? candidate.targetId;
    if (!combatId || !isStartableCombatId(combatId)) {
      return { ok: false, reason: '알 수 없는 전투입니다.' };
    }
    if (state.player.currentHp <= 0) {
      return { ok: false, reason: '전투를 시작할 수 없는 상태입니다.' };
    }
    return { ok: true };
  }

  if (candidate.actionType === 'TALK' || candidate.actionType === 'ASK') {
    if (candidate.intent === CHOICE_INTENT.SHARE_INFORMATION) {
      const factId = candidate.metadata?.factId ?? candidate.secondaryTargetId;
      const toId = candidate.targetId;
      if (!factId || !toId) {
        return { ok: false, reason: '지금은 그 이야기를 전할 수 없다.' };
      }
      if (!isNpcAtCurrentLocation(state, toId)) {
        return { ok: false, reason: '현재 장소에 해당 대상이 없습니다.' };
      }
      if (!actorKnowsFact(state, 'player', factId)) {
        return { ok: false, reason: '전달자가 해당 사실을 모릅니다.' };
      }
      if (doesNpcKnowFact(state, toId, factId)) {
        return { ok: false, reason: '이미 알고 있거나 전달할 수 없습니다.' };
      }
      return { ok: true };
    }
    const npcId = candidate.targetId ?? talkNpcFromPrompt(candidate) ?? state.story.currentNpcId;
    if (!npcId) {
      return { ok: false, reason: '누구에게 말할지 분명하지 않다.' };
    }
    const parsed: ParsedAction = {
      actionType: candidate.actionType,
      targetId: npcId,
      rawInput: candidate.textTemplate,
      confidence: 1,
    };
    const result = validateAction(parsed, state);
    if (!result.valid) {
      return { ok: false, reason: result.reason ?? '현재 장소에 해당 대상이 없습니다.' };
    }
    return { ok: true };
  }

  if (candidate.actionType === 'HELP') {
    const questId = candidate.metadata?.questId ?? candidate.targetId;
    const quest = questId ? state.quests[questId] : undefined;
    if (!quest || quest.status !== 'AVAILABLE') {
      return { ok: false, reason: '아직 받을 수 없는 퀘스트입니다.' };
    }
    return { ok: true };
  }

  const parsed: ParsedAction = {
    actionType: candidate.actionType,
    targetId: candidate.targetId,
    secondaryTargetId: candidate.secondaryTargetId,
    rawInput: candidate.textTemplate,
    confidence: 1,
  };
  const result = validateAction(parsed, state);
  if (!result.valid) {
    return { ok: false, reason: result.reason ?? '지금은 그 행동을 할 수 없다.' };
  }
  return { ok: true };
}

function isStoryLockedAction(candidate: ChoiceCandidate): boolean {
  return candidate.source === 'STORY' && candidate.metadata?.storyAction == null;
}

function talkNpcFromPrompt(candidate: ChoiceCandidate): string | undefined {
  const prompt = candidate.metadata?.promptId ?? '';
  if (prompt.includes('seria') || getTalkPrompt(prompt)?.includes('세리아')) {
    return 'seria';
  }
  if (prompt.includes('marta') || prompt.includes('innkeeper')) {
    return 'innkeeper';
  }
  if (prompt.includes('leon')) {
    return 'leon';
  }
  return undefined;
}
