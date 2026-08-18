import { z } from 'zod';
import { ACTION_TYPES } from '../../game/actions/action-types';
import { CHOICE_INTENT, CHOICE_SOURCE, type DynamicChoice } from '../../game/story/choices/choice-types';
import type { DirectorChoiceResponse } from './director-types';

const ChoiceIntentSchema = z.enum([
  CHOICE_INTENT.PROGRESS_STORY,
  CHOICE_INTENT.TALK,
  CHOICE_INTENT.ASK,
  CHOICE_INTENT.INVESTIGATE,
  CHOICE_INTENT.MOVE,
  CHOICE_INTENT.FIGHT,
  CHOICE_INTENT.AVOID,
  CHOICE_INTENT.HELP,
  CHOICE_INTENT.SHARE_INFORMATION,
  CHOICE_INTENT.USE_CLASS_ABILITY,
  CHOICE_INTENT.REST,
  CHOICE_INTENT.GENERAL,
]);

const ChoiceSourceSchema = z.enum([
  CHOICE_SOURCE.QUEST,
  CHOICE_SOURCE.STORY,
  CHOICE_SOURCE.NPC,
  CHOICE_SOURCE.EXPLORATION,
  CHOICE_SOURCE.COMBAT,
  CHOICE_SOURCE.CLASS,
  CHOICE_SOURCE.RELATIONSHIP,
  CHOICE_SOURCE.KNOWLEDGE,
  CHOICE_SOURCE.MEMORY,
  CHOICE_SOURCE.MOVE,
  CHOICE_SOURCE.GENERAL,
]);

const ActionTypeSchema = z.enum(ACTION_TYPES);

export const DynamicChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  intent: ChoiceIntentSchema,
  actionType: ActionTypeSchema,
  targetId: z.string().optional(),
  secondaryTargetId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  source: ChoiceSourceSchema,
  priority: z.number(),
  candidateId: z.string().min(1),
});

export const DirectorChoiceResponseSchema = z.object({
  turnId: z.number().int().nonnegative(),
  choices: z.array(DynamicChoiceSchema).max(3),
  debugReason: z.string().optional(),
});

export function parseDirectorChoiceResponse(value: unknown): DirectorChoiceResponse | null {
  const parsed = DirectorChoiceResponseSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return {
    turnId: parsed.data.turnId,
    choices: parsed.data.choices as DynamicChoice[],
    debugReason: parsed.data.debugReason,
  };
}
