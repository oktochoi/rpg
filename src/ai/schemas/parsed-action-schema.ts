import { z } from 'zod';
import { ACTION_TYPES, type ParsedAction } from '../../game/actions/action-types';

export const ParsedActionSchema = z.object({
  actionType: z.enum(ACTION_TYPES),
  targetId: z.string().optional(),
  secondaryTargetId: z.string().optional(),
  method: z.string().optional(),
  amount: z.number().finite().optional(),
  itemId: z.string().optional(),
  skillId: z.string().optional(),
  speech: z.string().optional(),
  rawInput: z.string().default(''),
  confidence: z.number().min(0).max(1),
});

export function parseParsedAction(value: unknown): ParsedAction | null {
  const parsed = ParsedActionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function constrainParsedAction(
  action: ParsedAction,
  allowedTargetIds: ReadonlySet<string>
): ParsedAction {
  const targetId = action.targetId?.trim() ? action.targetId : undefined;
  const secondaryTargetId = action.secondaryTargetId?.trim() ? action.secondaryTargetId : undefined;
  const normalized = { ...action, targetId, secondaryTargetId };
  if (normalized.actionType === 'UNKNOWN' || normalized.confidence < 0.4) {
    return {
      ...normalized,
      actionType: 'UNKNOWN',
      confidence: Math.min(normalized.confidence, 0.3),
    };
  }
  if (normalized.targetId && !allowedTargetIds.has(normalized.targetId)) {
    return {
      ...normalized,
      actionType: 'UNKNOWN',
      targetId: undefined,
      confidence: 0.2,
      speech: normalized.rawInput,
    };
  }
  if (normalized.secondaryTargetId && !allowedTargetIds.has(normalized.secondaryTargetId)) {
    return { ...normalized, secondaryTargetId: undefined };
  }
  return normalized;
}
