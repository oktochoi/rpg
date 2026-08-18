import type { FactId, NpcId } from '../core/ids';
import { KNOWLEDGE_CONFIDENCE } from '../knowledge/knowledge-config';

export type KnowledgeSourceType = 'WITNESSED' | 'TOLD_BY_PLAYER' | 'TOLD_BY_NPC' | 'PUBLIC_EVENT';

export interface NpcKnowledgeEntry {
  factId: FactId;
  sourceType: KnowledgeSourceType;
  sourceId?: string;
  confidence: number;
  learnedAtTurn: number;
}

/**
 * Facts this NPC actually knows. NPC AI may only receive this knowledge.
 * Must never store a copy of the entire world.
 */
export interface NpcKnowledge {
  npcId: NpcId;
  entries: readonly NpcKnowledgeEntry[];
}

export function createEmptyNpcKnowledge(npcId: NpcId): NpcKnowledge {
  return { npcId, entries: [] };
}

export function defaultConfidence(sourceType: KnowledgeSourceType): number {
  return KNOWLEDGE_CONFIDENCE[sourceType];
}

export function withNpcFact(knowledge: NpcKnowledge, entry: NpcKnowledgeEntry): NpcKnowledge {
  const existing = knowledge.entries.find((item) => item.factId === entry.factId);
  if (existing) {
    return knowledge;
  }

  return {
    ...knowledge,
    entries: [...knowledge.entries, entry],
  };
}

export function npcKnowsFact(knowledge: NpcKnowledge, factId: FactId): boolean {
  return knowledge.entries.some((entry) => entry.factId === factId);
}
