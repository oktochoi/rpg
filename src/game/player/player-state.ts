import type { LocationId, PlayerId } from '../core/ids';

export interface PlayerState {
  id: PlayerId;
  name: string;
  locationId: LocationId;
}
