import type { FactId, MemoryId, NpcId } from '../../core/ids';
import type { RelationshipChangeReason } from '../../relationships/relationship-types';

export type NPCMemoryType =
  | 'PLAYER_HELPED_ME'
  | 'PLAYER_SAVED_ME'
  | 'PLAYER_ATTACKED_ME'
  | 'PLAYER_THREATENED_ME'
  | 'PLAYER_BETRAYED_ME'
  | 'PLAYER_KEPT_PROMISE'
  | 'PLAYER_BROKE_PROMISE'
  | 'PLAYER_GAVE_GIFT'
  | 'PLAYER_SHOWED_SKILL'
  | 'SHARED_EXPERIENCE'
  | 'IMPORTANT_CONVERSATION'
  | 'OTHER';

export type MemoryEmotion =
  | 'GRATITUDE'
  | 'ANGER'
  | 'FEAR'
  | 'RESPECT'
  | 'TRUST'
  | 'SUSPICION'
  | 'SADNESS'
  | 'NEUTRAL';

export interface NPCMemory {
  id: MemoryId;
  npcId: NpcId;
  type: NPCMemoryType;
  summary: string;
  relatedFactIds: readonly FactId[];
  importance: number;
  emotionalTag?: MemoryEmotion;
  createdAtTurn: number;
  lastRecalledAtTurn?: number;
  sourceEventId?: string;
}

export const MEMORY_IMPORTANCE_MIN = 1;
export const MEMORY_IMPORTANCE_MAX = 10;
export const MAX_MEMORIES_PER_NPC = 50;
export const PROTECTED_MEMORY_IMPORTANCE = 8;
export const LOW_MEMORY_IMPORTANCE = 3;
export const FORGET_LOW_IMPORTANCE_AFTER_TURNS = 30;

export interface MemoryRule {
  createMemory: boolean;
  type: NPCMemoryType;
  importance: number;
  emotionalTag: MemoryEmotion;
}

export type MemoryRuleMap = Readonly<Partial<Record<RelationshipChangeReason, MemoryRule>>>;

export interface RelevantMemoryContext {
  playerInput?: string;
  locationId?: string;
}
