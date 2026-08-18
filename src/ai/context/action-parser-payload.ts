import { ACTION_TYPES } from '../../game/actions/action-types';
import type { ActionParserContext } from '../../game/actions/parser-context';
import { KNOWN_ENTITIES } from '../../game/actions/entity-resolver';
import { LOCATION_DEFINITIONS } from '../../game/world/locations/location-definitions';
import { EXPLORATION_POINTS } from '../../game/world/exploration/exploration-definitions';
import type { ActionParserAiPayload } from '../payloads';

export function buildActionParserAiPayload(input: string, context: ActionParserContext): ActionParserAiPayload {
  const present = new Set(context.currentNpcIds);
  return {
    rawInput: input,
    currentLocationId: context.currentLocationId,
    currentSceneId: context.currentSceneId,
    playerClass: context.playerJob,
    presentNpcs: KNOWN_ENTITIES.filter((entity) => present.has(entity.id)).map((entity) => ({
      id: entity.id,
      name: entity.name,
      aliases: entity.aliases,
      kind: entity.kind,
    })),
    knownEntities: (context.knownEntityIds ?? KNOWN_ENTITIES.map((entity) => entity.id)).map((id) => {
      const entity = KNOWN_ENTITIES.find((item) => item.id === id);
      return {
        id,
        name: entity?.name ?? id,
        aliases: entity?.aliases,
        kind: entity?.kind,
      };
    }),
    locations: Object.values(LOCATION_DEFINITIONS).map((location) => ({
      id: location.id,
      name: location.name,
    })),
    explorationIds: context.knownExplorationIds ?? Object.keys(EXPLORATION_POINTS),
    allowedActionTypes: context.allowedActionTypes ?? [...ACTION_TYPES],
  };
}

export function allowedParserTargetIds(payload: ActionParserAiPayload): Set<string> {
  return new Set([
    ...payload.presentNpcs.map((item) => item.id),
    ...payload.knownEntities.map((item) => item.id),
    ...payload.locations.map((item) => item.id),
    ...payload.explorationIds,
  ]);
}
