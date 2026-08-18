import type { ActorId, FactId, LocationId } from '../../core/ids';

export type WorldFactType =
  | 'NPC_MET'
  | 'NPC_HELPED'
  | 'NPC_ATTACKED'
  | 'ENEMY_DEFEATED'
  | 'COMBAT_WON'
  | 'COMBAT_LOST'
  | 'ITEM_OBTAINED'
  | 'LOCATION_DISCOVERED'
  | 'INFORMATION_REVEALED'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'IMPORTANT_EVENT';

export type PublicLevel = 'PRIVATE' | 'LOCAL' | 'PUBLIC';

/**
 * Structured record of something that actually happened in the world.
 * Must not store narrative prose; AI/NPC layers generate dialogue later.
 */
export interface WorldFact {
  id: FactId;
  type: WorldFactType;
  occurredAtTurn: number;
  locationId: LocationId;
  actorIds: ActorId[];
  targetIds?: ActorId[];
  witnessIds: ActorId[];
  tags: string[];
  publicLevel: PublicLevel;
  payload?: Readonly<Record<string, string | number | boolean>>;
}
