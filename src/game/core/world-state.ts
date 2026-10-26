import type { LocationId } from './ids';
import type { WorldFact } from '../world/facts/world-fact';
import type { LocationRuntimeState } from '../world/locations/location-types';

export interface WorldState {
  currentLocationId: LocationId;
  day: number;
  totalMinutes: number;
  turn: number;
  facts: readonly WorldFact[];
  locations: Readonly<Record<string, LocationRuntimeState>>;
  flags: Readonly<Record<string, boolean>>;
  exploredPointIds: readonly string[];
  clearedEncounterIds: readonly string[];
  /** Pity counter for ruins key hunt (Save/Load). */
  ruinsKeyFailedAttempts: number;
}
