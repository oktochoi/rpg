import type { GameState } from '../core/game-state';
import { ACTION_TYPES } from './action-types';
import { getPresentEntityIds, KNOWN_ENTITIES } from './entity-resolver';
import { EXPLORATION_POINTS } from '../world/exploration/exploration-definitions';
import { LOCATION_DEFINITIONS } from '../world/locations/location-definitions';
import type { ActionParserContext } from './parser-context';

export function buildActionParserContext(state: Readonly<GameState>): ActionParserContext {
  return {
    currentLocationId: state.world.currentLocationId,
    currentNpcIds: getPresentEntityIds(state),
    currentSceneId: state.story.currentSceneId,
    playerJob: state.player.classId,
    knownEntityIds: KNOWN_ENTITIES.map((entity) => entity.id),
    knownLocationIds: Object.keys(LOCATION_DEFINITIONS),
    knownExplorationIds: Object.keys(EXPLORATION_POINTS),
    allowedActionTypes: ACTION_TYPES,
  };
}
