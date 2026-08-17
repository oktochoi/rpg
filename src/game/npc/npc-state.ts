import type { LocationId, NpcId } from '../core/ids';
import type { NpcKnowledge } from './npc-knowledge';

export interface NpcState {
  id: NpcId;
  name: string;
  locationId: LocationId;
  knowledge: NpcKnowledge;
}
