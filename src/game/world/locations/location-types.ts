import type { LocationId } from '../../core/ids';

export const LOCATION_TYPE = {
  VILLAGE: 'VILLAGE',
  INN: 'INN',
  ROAD: 'ROAD',
  FOREST: 'FOREST',
  RUINS: 'RUINS',
  GATE: 'GATE',
  DUNGEON: 'DUNGEON',
  SPECIAL: 'SPECIAL',
} as const;

export type LocationType = (typeof LOCATION_TYPE)[keyof typeof LOCATION_TYPE];

export type LocationAccessRequirement =
  | { type: 'QUEST_COMPLETED'; questId: string }
  | { type: 'FACT_KNOWN'; factId: string }
  | { type: 'FLAG'; flagId: string };

export interface LocationDefinition {
  id: LocationId;
  regionId: string;
  name: string;
  description: string;
  type: LocationType;
  connectedLocationIds: readonly LocationId[];
  defaultNpcIds: readonly string[];
  tags: readonly string[];
  discoveryRequired: boolean;
  accessRequirements?: readonly LocationAccessRequirement[];
  encounterIds?: readonly string[];
  /** Presentation only. Story logic must not branch on this. */
  audioTheme?: 'STORY_SAFE' | 'STORY_MYSTERY';
}

export interface LocationRuntimeState {
  locationId: LocationId;
  discovered: boolean;
  visited: boolean;
  visitCount: number;
  firstVisitedAtTurn?: number;
  lastVisitedAtTurn?: number;
  flags: Readonly<Record<string, boolean>>;
}

export interface LocationContext {
  currentLocation: LocationDefinition;
  connectedLocations: readonly LocationDefinition[];
  presentNpcIds: readonly string[];
  availableEncounterIds: readonly string[];
  explorationPointIds: readonly string[];
  flags: Readonly<Record<string, boolean>>;
}
