import type { ChoiceCandidate } from '../../game/story/choices/choice-types';
import { getSharedAiTransport, type AiTransport } from '../client/ai-transport';
import { buildDirectorAiPayload } from '../context/director-ai-payload';
import { recordAiDebug } from '../debug/ai-debug';
import { hydrateDirectorLlmResponse } from './director-llm-schema';
import type { DirectorChoiceResponse, StoryDirector, StoryDirectorContext } from './director-types';

export interface RealStoryDirectorOptions {
  fallback: StoryDirector;
  transport?: AiTransport;
}

export function createRealStoryDirector(options: RealStoryDirectorOptions): StoryDirector {
  const transport = options.transport ?? getSharedAiTransport();
  return {
    async generateChoices(
      context: StoryDirectorContext,
      candidates: ChoiceCandidate[]
    ): Promise<DirectorChoiceResponse> {
      try {
        const payload = buildDirectorAiPayload(context, candidates);
        const result = await transport.request('director', context.turnId, payload);
        const hydrated = hydrateDirectorLlmResponse(result.data, context.turnId, candidates);
        if (!result.success || !hydrated) {
          recordAiDebug({
            lastRequestType: 'director',
            success: false,
            fallbackUsed: true,
            schemaValid: false,
            error: result.error ?? 'invalid_candidate',
            latencyMs: result.latencyMs ?? null,
            provider: result.provider,
            turnId: context.turnId,
            requestId: result.requestId,
          });
          return options.fallback.generateChoices(context, candidates);
        }
        recordAiDebug({
          lastRequestType: 'director',
          success: true,
          fallbackUsed: false,
          schemaValid: true,
          latencyMs: result.latencyMs ?? null,
          provider: result.provider,
          turnId: context.turnId,
          requestId: result.requestId,
        });
        return hydrated;
      } catch {
        recordAiDebug({
          lastRequestType: 'director',
          success: false,
          fallbackUsed: true,
          error: 'director_error',
          turnId: context.turnId,
        });
        return options.fallback.generateChoices(context, candidates);
      }
    },
  };
}

/**
 * @deprecated Use createRealStoryDirector. Kept so existing imports keep compiling.
 */
export class RealStoryDirector implements StoryDirector {
  private readonly inner: StoryDirector;

  constructor(fallback: StoryDirector, transport?: AiTransport) {
    this.inner = createRealStoryDirector({ fallback, transport });
  }

  generateChoices(context: StoryDirectorContext, candidates: ChoiceCandidate[]): Promise<DirectorChoiceResponse> {
    return this.inner.generateChoices(context, candidates);
  }
}
