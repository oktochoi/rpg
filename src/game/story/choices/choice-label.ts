import type { ChoiceCandidate } from './choice-types';
import { CHOICE_INTENT } from './choice-types';

const INTERNAL_ID_PATTERN =
  /\b(choice_|npc_topic_|scene_|quest_|fact_|encounter_|ch1_|story_|move_|combat_|explore_|utility_|advance_|knowledge_|fallback_|general_)/i;

export function looksLikeInternalId(text: string | null | undefined): boolean {
  if (!text) {
    return true;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  if (INTERNAL_ID_PATTERN.test(trimmed)) {
    return true;
  }
  if (/^[a-z0-9_]+$/.test(trimmed) && trimmed.includes('_') && !/\s/.test(trimmed) && trimmed.length > 12) {
    return true;
  }
  return false;
}

export function safeFallbackChoiceLabel(actionType?: string, intent?: string): string {
  if (intent === CHOICE_INTENT.PROGRESS_STORY || actionType === 'WAIT' && intent === 'PROGRESS_STORY') {
    return '앞으로 움직인다';
  }
  if (actionType === 'MOVE') {
    return '이동한다';
  }
  if (actionType === 'TALK' || actionType === 'ASK') {
    return '대화를 마친다';
  }
  if (actionType === 'REST') {
    return '휴식한다';
  }
  if (actionType === 'ATTACK') {
    return '싸운다';
  }
  if (actionType === 'INVESTIGATE') {
    return '주변을 살핀다';
  }
  return '앞으로 움직인다';
}

export function resolvePlayerFacingChoiceLabel(input: {
  text?: string | null;
  template?: string | null;
  actionType?: string;
  intent?: string;
  candidateId?: string;
}): string {
  const preferred = input.text?.trim();
  if (preferred && !looksLikeInternalId(preferred)) {
    return preferred;
  }
  const template = input.template?.trim();
  if (template && !looksLikeInternalId(template)) {
    return template;
  }
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn('choice label missing', input.candidateId ?? input.text);
  }
  return safeFallbackChoiceLabel(input.actionType, input.intent);
}

export function resolveCandidateFacingLabel(candidate: Pick<ChoiceCandidate, 'textTemplate' | 'actionType' | 'intent' | 'id'>): string {
  return resolvePlayerFacingChoiceLabel({
    text: candidate.textTemplate,
    template: candidate.textTemplate,
    actionType: candidate.actionType,
    intent: candidate.intent,
    candidateId: candidate.id,
  });
}

export function productionTextHasInternalId(text: string): boolean {
  return INTERNAL_ID_PATTERN.test(text);
}
