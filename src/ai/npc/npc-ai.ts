import type { NpcId } from '../../game/core/ids';
import type { NpcKnowledge } from '../../game/npc/npc-knowledge';

export interface NpcDialogueProposal {
  npcId: NpcId;
  line: string;
}

/**
 * Produces NPC dialogue from knowledge the NPC actually has.
 * Must not modify GameState; output is a proposal only.
 */
export interface NpcAi {
  proposeDialogue(knowledge: NpcKnowledge, playerLine: string): NpcDialogueProposal;
}
