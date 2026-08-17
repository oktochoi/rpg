import type { NpcId } from '../core/ids';

/**
 * Facts this NPC actually knows. NPC AI may only receive this knowledge.
 */
export interface NpcKnowledge {
  npcId: NpcId;
  knownFacts: readonly string[];
}
