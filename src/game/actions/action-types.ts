import { PLAYER_CLASS_ID } from '../player/classes';

export type ActionType =
  | 'TALK'
  | 'ASK'
  | 'MOVE'
  | 'INVESTIGATE'
  | 'GIVE'
  | 'BRIBE'
  | 'THREATEN'
  | 'STEAL'
  | 'ATTACK'
  | 'USE_ITEM'
  | 'USE_SKILL'
  | 'WAIT'
  | 'REST'
  | 'LEAVE'
  | 'HELP'
  | 'RESCUE'
  | 'UNKNOWN';

export interface ParsedAction {
  actionType: ActionType;
  targetId?: string;
  secondaryTargetId?: string;
  method?: string;
  amount?: number;
  itemId?: string;
  skillId?: string;
  speech?: string;
  rawInput: string;
  confidence: number;
}

export type ActionValidationResultType =
  | 'VALID'
  | 'INVALID'
  | 'REQUIRES_COMBAT'
  | 'REQUIRES_TARGET'
  | 'UNKNOWN_ACTION';

export interface ActionValidationResult {
  valid: boolean;
  resultType: ActionValidationResultType;
  reason?: string;
}

export interface ActionResolution {
  success: boolean;
  actionType: ActionType;
  narrative: string;
  generatedEventIds?: string[];
  nextMode?: 'STORY' | 'DIALOGUE' | 'COMBAT';
}

export const ACTION_CONFIDENCE = {
  accept: 0.7,
  limited: 0.4,
} as const;

export const ACTION_TYPES: readonly ActionType[] = [
  'TALK',
  'ASK',
  'MOVE',
  'INVESTIGATE',
  'GIVE',
  'BRIBE',
  'THREATEN',
  'STEAL',
  'ATTACK',
  'USE_ITEM',
  'USE_SKILL',
  'WAIT',
  'REST',
  'LEAVE',
  'HELP',
  'RESCUE',
  'UNKNOWN',
];

export function isActionType(value: unknown): value is ActionType {
  return typeof value === 'string' && (ACTION_TYPES as readonly string[]).includes(value);
}

export function isParsedAction(value: unknown): value is ParsedAction {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const action = value as ParsedAction;
  return isActionType(action.actionType) && typeof action.rawInput === 'string' && typeof action.confidence === 'number';
}

export function jobModifier(classId: string, actionType: ActionType): number {
  if (classId === PLAYER_CLASS_ID.ROGUE && actionType === 'STEAL') {
    return 1;
  }
  if (classId === PLAYER_CLASS_ID.WARRIOR && actionType === 'THREATEN') {
    return 1;
  }
  if (classId === PLAYER_CLASS_ID.MAGE && actionType === 'USE_SKILL') {
    return 1;
  }
  return 0;
}
