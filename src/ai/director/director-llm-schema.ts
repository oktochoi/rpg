import { z } from 'zod';
import { containsLeakedSecret } from '../../game/story/choices/choice-templates';
import { choiceIdFor, type ChoiceCandidate, type DynamicChoice } from '../../game/story/choices/choice-types';
import { resolvePlayerFacingChoiceLabel } from '../../game/story/choices/choice-label';
import type { DirectorChoiceResponse } from './director-types';
import { DirectorChoiceResponseSchema, parseDirectorChoiceResponse } from './director-schema';

export const DirectorLlmChoiceSchema = z.object({
  candidateId: z.string().min(1),
  text: z.string().min(1),
});

export const DirectorLlmResponseSchema = z.object({
  turnId: z.number().int().nonnegative(),
  choices: z.array(DirectorLlmChoiceSchema).min(1).max(3),
});

export type DirectorLlmResponse = z.infer<typeof DirectorLlmResponseSchema>;

export function parseDirectorLlmResponse(value: unknown): DirectorLlmResponse | null {
  const parsed = DirectorLlmResponseSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function hydrateDirectorLlmResponse(
  value: unknown,
  turnId: number,
  candidates: readonly ChoiceCandidate[]
): DirectorChoiceResponse | null {
  const parsed = parseDirectorLlmResponse(value);
  if (!parsed || parsed.turnId !== turnId) {
    return null;
  }

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const seen = new Set<string>();
  const choices: DynamicChoice[] = [];

  for (const item of parsed.choices) {
    if (seen.has(item.candidateId)) {
      return null;
    }
    seen.add(item.candidateId);
    const candidate = byId.get(item.candidateId);
    if (!candidate || !item.text.trim() || containsLeakedSecret(item.text)) {
      return null;
    }
    choices.push({
      id: choiceIdFor(turnId, candidate.id),
      text: resolvePlayerFacingChoiceLabel({
        text: item.text.trim(),
        template: candidate.textTemplate,
        actionType: candidate.actionType,
        intent: candidate.intent,
        candidateId: candidate.id,
      }),
      intent: candidate.intent,
      actionType: candidate.actionType,
      targetId: candidate.targetId,
      secondaryTargetId: candidate.secondaryTargetId,
      metadata: candidate.metadata as Record<string, unknown> | undefined,
      source: candidate.source,
      priority: candidate.basePriority,
      candidateId: candidate.id,
    });
  }

  return parseDirectorChoiceResponse({
    turnId,
    choices,
  });
}

export { DirectorChoiceResponseSchema };
