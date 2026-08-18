import type { GameState } from '../../game/core/game-state';
import { buildChoiceCandidates, type CandidateBuildOptions } from '../../game/story/choices/choice-candidate-builder';
import { createFallbackCandidates } from '../../game/story/choices/choice-fallback';
import { buildStoryDirectorContext } from '../../game/story/choices/director-context-builder';
import { rankChoiceCandidates, toDynamicChoices } from '../../game/story/choices/choice-ranking';
import { containsLeakedSecret } from '../../game/story/choices/choice-templates';
import { shouldUseRealAiClient, type AiTransport } from '../client/ai-transport';
import { parseDirectorChoiceResponse } from './director-schema';
import { createMockStoryDirector } from './mock-story-director';
import { createRealStoryDirector } from './real-story-director';
import type { DirectorChoiceResponse, StoryDirector } from './director-types';
import { isStaleDirectorResponse } from './director-types';

export function createStoryDirector(options?: { transport?: AiTransport; forceReal?: boolean }): StoryDirector {
  const mock = createMockStoryDirector();
  if (!options?.forceReal && !options?.transport && !shouldUseRealAiClient()) {
    return mock;
  }
  return createRealStoryDirector({ fallback: mock, transport: options?.transport });
}

export async function generateStoryChoices(
  state: Readonly<GameState>,
  director: StoryDirector = createStoryDirector(),
  options?: CandidateBuildOptions
): Promise<DirectorChoiceResponse> {
  if (state.mode === 'COMBAT') {
    return { turnId: state.world.turn, choices: [], debugReason: 'combat_mode' };
  }

  const context = buildStoryDirectorContext(state);
  const candidates = buildChoiceCandidates(state, context, options);
  const fallback = fallbackResponse(state);

  try {
    const raw = await director.generateChoices(context, candidates);
    if (isStaleDirectorResponse(context.turnId, raw)) {
      return { turnId: context.turnId, choices: [], debugReason: 'stale_turn' };
    }
    const parsed = parseDirectorChoiceResponse(raw);
    if (!parsed) {
      return fallback;
    }
    const allowedIds = new Set(candidates.map((item) => item.id));
    if (candidates.length === 0) {
      return parsed.choices.length > 0 ? parsed : fallback;
    }
    const filtered = parsed.choices.filter(
      (choice) => allowedIds.has(choice.candidateId) && !containsLeakedSecret(choice.text)
    );
    if (filtered.length === 0) {
      return fallback;
    }
    return { ...parsed, choices: filtered };
  } catch {
    return fallback;
  }
}

export function fallbackResponse(state: Readonly<GameState>): DirectorChoiceResponse {
  const context = buildStoryDirectorContext(state);
  const live = buildChoiceCandidates(state, context);
  const pool = live.length > 0 ? live : createFallbackCandidates(state);
  const ranked = rankChoiceCandidates(pool);
  return {
    turnId: state.world.turn,
    choices: toDynamicChoices(state.world.turn, ranked.selected),
    debugReason: 'fallback',
  };
}
