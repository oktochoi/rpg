import type { NpcId } from '../core/ids';
import type { RelationshipState } from '../npc/relationship';

export type { RelationshipState };

export type RelationshipChangeReason =
  | 'PLAYER_HELPED_NPC'
  | 'PLAYER_SAVED_NPC'
  | 'PLAYER_GAVE_GIFT'
  | 'PLAYER_KEPT_PROMISE'
  | 'PLAYER_BROKE_PROMISE'
  | 'PLAYER_LIED'
  | 'PLAYER_THREATENED_NPC'
  | 'PLAYER_ATTACKED_NPC'
  | 'PLAYER_DEFEATED_NPC'
  | 'PLAYER_SHOWED_SKILL'
  | 'PLAYER_SHARED_INFORMATION'
  | 'PLAYER_INSULTED_NPC'
  | 'PLAYER_COMPLETED_REQUEST'
  | 'PLAYER_PROVED_CAPABILITY';

export interface RelationshipDelta {
  npcId: NpcId;
  affection?: number;
  trust?: number;
  fear?: number;
  respect?: number;
  reason: RelationshipChangeReason;
  sourceEventId?: string;
}

export type NpcAttitude = 'FRIENDLY' | 'NEUTRAL' | 'SUSPICIOUS' | 'HOSTILE' | 'AFRAID' | 'RESPECTFUL';

export interface RelationshipRequest {
  npcId: NpcId;
  reason: RelationshipChangeReason;
  sourceEventId: string;
}
