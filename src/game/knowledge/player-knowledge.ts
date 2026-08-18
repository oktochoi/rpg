import type { FactId } from '../core/ids';

export interface PlayerKnowledge {
  knownFactIds: readonly FactId[];
}

export function createEmptyPlayerKnowledge(): PlayerKnowledge {
  return { knownFactIds: [] };
}

export function withPlayerFact(knowledge: PlayerKnowledge, factId: FactId): PlayerKnowledge {
  if (knowledge.knownFactIds.includes(factId)) {
    return knowledge;
  }

  return {
    knownFactIds: [...knowledge.knownFactIds, factId],
  };
}
