import type { ChoiceCandidate } from '../../game/story/choices/choice-types';
import { rankChoiceCandidates, toDynamicChoices } from '../../game/story/choices/choice-ranking';
import { createFallbackCandidates } from '../../game/story/choices/choice-fallback';
import type { DirectorChoiceResponse, DirectorDebugSnapshot, StoryDirector, StoryDirectorContext } from './director-types';

let lastDebug: DirectorDebugSnapshot | null = null;

export function getLastDirectorDebug(): DirectorDebugSnapshot | null {
  return lastDebug;
}

export function createMockStoryDirector(): StoryDirector {
  return {
    async generateChoices(
      context: StoryDirectorContext,
      candidates: ChoiceCandidate[]
    ): Promise<DirectorChoiceResponse> {
      const pool = candidates.length > 0 ? candidates : createFallbackCandidates();
      const ranked = rankChoiceCandidates(pool);
      lastDebug = {
        ...ranked.debug,
        currentSceneId: context.currentSceneId,
        turnId: context.turnId,
      };
      const reasons = [
        `scene=${context.currentSceneId}`,
        `candidates=${pool.length}`,
        `selected=${ranked.selected.map((item) => item.id).join(',')}`,
      ];
      return {
        turnId: context.turnId,
        choices: toDynamicChoices(context.turnId, ranked.selected),
        debugReason: reasons.join(' | '),
      };
    },
  };
}
