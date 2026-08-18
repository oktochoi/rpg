export type { WorldFact, WorldFactType, PublicLevel } from './facts/world-fact';
export { createCombatFacts, getCombatWitnessContext, createActionFact } from './facts/fact-service';
export { REGION_DEFINITIONS, REGION_ID, getRegionDefinition } from './regions/region-definitions';
export type { RegionDefinition } from './regions/region-types';
export {
  LOCATION_DEFINITIONS,
  LOCATION_ID,
  WORLD_FLAG,
  RUINS_GUARDIAN_FACT_ID,
  getLocationDefinition,
  allLocationDefinitions,
} from './locations/location-definitions';
export type { LocationDefinition, LocationRuntimeState, LocationContext, LocationType } from './locations/location-types';
export {
  getNpcsAtLocation,
  getCurrentLocationNpcs,
  getLocationDescription,
  buildLocationContext,
} from './locations/location-selectors';
export { validateMoveToLocation, validateMoveDestination, eventsForMoveToLocation } from './locations/location-rules';
export { resolveLocationAlias } from './locations/location-alias';
export { createInitialLocationRuntimes } from './locations/location-runtime';
