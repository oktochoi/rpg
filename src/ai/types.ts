import type { FactId, MemoryId, NpcId } from '../game/core/ids';

export type NpcEmotion = 'NEUTRAL' | 'FRIENDLY' | 'SUSPICIOUS' | 'ANGRY' | 'AFRAID' | 'CURIOUS';

export type NpcDialogueIntent =
  | 'ASK_IDENTITY'
  | 'ASK_RUINS'
  | 'ASK_GOBLIN'
  | 'ASK_RECENT_EVENT'
  | 'ASK_RELATIONSHIP'
  | 'ASK_MEMORY'
  | 'GENERAL';

export interface NpcDialogueResponse {
  npcId: NpcId;
  dialogue: string;
  emotion: NpcEmotion;
  usedFactIds: FactId[];
  usedMemoryIds: MemoryId[];
  referencedClaimIds?: string[];
}

export interface NpcDialogueService {
  respond(npcId: NpcId, playerInput: string): Promise<NpcDialogueResponse>;
}
