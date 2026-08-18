import type { ActionType } from '../../actions/action-types';
import type { StoryChoiceAction } from '../story-scene-types';

export const CHOICE_INTENT = {
  PROGRESS_STORY: 'PROGRESS_STORY',
  TALK: 'TALK',
  ASK: 'ASK',
  INVESTIGATE: 'INVESTIGATE',
  MOVE: 'MOVE',
  FIGHT: 'FIGHT',
  AVOID: 'AVOID',
  HELP: 'HELP',
  SHARE_INFORMATION: 'SHARE_INFORMATION',
  USE_CLASS_ABILITY: 'USE_CLASS_ABILITY',
  REST: 'REST',
  GENERAL: 'GENERAL',
} as const;

export type ChoiceIntent = (typeof CHOICE_INTENT)[keyof typeof CHOICE_INTENT];

export const CHOICE_SOURCE = {
  QUEST: 'QUEST',
  STORY: 'STORY',
  NPC: 'NPC',
  EXPLORATION: 'EXPLORATION',
  COMBAT: 'COMBAT',
  CLASS: 'CLASS',
  RELATIONSHIP: 'RELATIONSHIP',
  KNOWLEDGE: 'KNOWLEDGE',
  MEMORY: 'MEMORY',
  MOVE: 'MOVE',
  GENERAL: 'GENERAL',
} as const;

export type ChoiceSource = (typeof CHOICE_SOURCE)[keyof typeof CHOICE_SOURCE];

export interface ChoiceCandidateMetadata {
  storyChoiceId?: string;
  storyAction?: StoryChoiceAction;
  encounterId?: string;
  locationId?: string;
  factId?: string;
  explorationPointId?: string;
  promptId?: string;
  questId?: string;
  topic?: string;
  topicId?: string;
  semanticKey?: string;
  classId?: string;
}

export interface ChoiceCandidate {
  id: string;
  actionType: ActionType;
  targetId?: string;
  secondaryTargetId?: string;
  intent: ChoiceIntent;
  source: ChoiceSource;
  basePriority: number;
  textTemplate: string;
  metadata?: ChoiceCandidateMetadata;
  critical?: boolean;
  semanticKey?: string;
}

export interface DynamicChoice {
  id: string;
  text: string;
  intent: ChoiceIntent;
  actionType: ActionType;
  targetId?: string;
  secondaryTargetId?: string;
  metadata?: Record<string, unknown>;
  source: ChoiceSource;
  priority: number;
  candidateId: string;
}

export function choiceIdFor(turnId: number, candidateId: string): string {
  return `choice_${turnId}_${candidateId}`;
}

export function candidateIdFromChoiceId(choiceId: string, turnId: number): string | null {
  const prefix = `choice_${turnId}_`;
  if (!choiceId.startsWith(prefix)) {
    return choiceId.startsWith('choice_') ? choiceId.replace(/^choice_\d+_/, '') : choiceId;
  }
  return choiceId.slice(prefix.length);
}

export function candidateActionKey(candidate: ChoiceCandidate): string {
  const meta = candidate.metadata;
  return [
    candidate.semanticKey ?? meta?.semanticKey ?? '',
    candidate.actionType,
    candidate.targetId ?? '',
    candidate.secondaryTargetId ?? '',
    meta?.encounterId ?? '',
    meta?.factId ?? '',
    meta?.explorationPointId ?? '',
    meta?.storyAction?.type ?? '',
    meta?.locationId ?? '',
    meta?.promptId ?? '',
    meta?.topicId ?? '',
    candidate.intent,
  ].join('|');
}
