import type { MemoryId, NpcId } from '../../game/core/ids';

export interface MemoryEntry {
  id: MemoryId;
  npcId?: NpcId;
  content: string;
}

/**
 * Recalls stored facts. Does not write GameState.
 */
export interface MemoryStore {
  recall(npcId: NpcId): readonly MemoryEntry[];
}
