import { allLocationDefinitions, LOCATION_ID } from './location-definitions';
import type { LocationRuntimeState } from './location-types';

export function createLocationRuntime(
  locationId: string,
  options: Partial<LocationRuntimeState> = {}
): LocationRuntimeState {
  return {
    locationId,
    discovered: options.discovered ?? false,
    visited: options.visited ?? false,
    visitCount: options.visitCount ?? 0,
    firstVisitedAtTurn: options.firstVisitedAtTurn,
    lastVisitedAtTurn: options.lastVisitedAtTurn,
    flags: options.flags ?? {},
  };
}

export function createInitialLocationRuntimes(): Record<string, LocationRuntimeState> {
  const locations: Record<string, LocationRuntimeState> = {};
  for (const definition of allLocationDefinitions()) {
    const knownStart =
      definition.id === LOCATION_ID.LUEN_VILLAGE ||
      definition.id === LOCATION_ID.BLUE_MOON_INN ||
      definition.id === LOCATION_ID.LUEN_ADVENTURERS_GUILD ||
      definition.id === LOCATION_ID.LUEN_GENERAL_STORE ||
      definition.id === LOCATION_ID.LUEN_TRAINING_GROUND;
    const visited = definition.id === LOCATION_ID.LUEN_VILLAGE;
    locations[definition.id] = createLocationRuntime(definition.id, {
      discovered: knownStart,
      visited,
      visitCount: visited ? 1 : 0,
      firstVisitedAtTurn: visited ? 1 : undefined,
      lastVisitedAtTurn: visited ? 1 : undefined,
    });
  }
  return locations;
}
