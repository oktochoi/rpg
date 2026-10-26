import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { eventsForRecordedFact } from '../../knowledge/knowledge-service';
import { dialogueMatchesTopic } from '../../quests/quest-progress';
import { RUINS_OFFER_TOPIC } from '../../quests/quest-definitions';
import { ENCOUNTER_ID, isBossEncounter } from '../../combat/encounters/encounter-definitions';
import { LOCATION_ID, RUINS_GUARDIAN_FACT_ID, WORLD_FLAG } from './location-definitions';
import { getLocationDefinition } from './location-definitions';
import type { WorldFact } from '../facts/world-fact';

export function eventsForLocationProgress(state: Readonly<GameState>, incoming: readonly GameEvent[]): GameEvent[] {
  const outgoing: GameEvent[] = [];
  for (const event of incoming) {
    if (event.type === 'LOCATION_ENTERED' && event.locationId === LOCATION_ID.ANCIENT_RUINS) {
      outgoing.push(...discoveryEvents(state, LOCATION_ID.ANCIENT_RUINS));
    }
    if (event.type === 'DIALOGUE_TURN_RECORDED' && event.npcId === 'seria' && dialogueMatchesTopic(event.playerText, RUINS_OFFER_TOPIC)) {
      outgoing.push(...discoveryEvents(state, LOCATION_ID.ANCIENT_RUINS));
    }
    if (event.type === 'COMBAT_WON' && isRuinsEncounter(event.combatId) && !state.world.flags[WORLD_FLAG.RUINS_GOBLINS_DEFEATED]) {
      outgoing.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED, value: true });
      if (state.world.flags[WORLD_FLAG.RUINS_COMBAT_LOST]) {
        outgoing.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_COMBAT_LOST, value: false });
      }
    }
    if (event.type === 'COMBAT_LOST' && isRuinsEncounter(event.combatId) && !state.world.flags[WORLD_FLAG.RUINS_GOBLINS_DEFEATED]) {
      outgoing.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_COMBAT_LOST, value: true });
    }
    if (event.type === 'COMBAT_WON' && isBossEncounter(event.combatId) && !state.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED]) {
      outgoing.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED, value: true });
      if (state.world.flags[WORLD_FLAG.RUINS_GUARDIAN_LOST]) {
        outgoing.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_GUARDIAN_LOST, value: false });
      }
      if (!state.world.facts.some((fact) => fact.id === RUINS_GUARDIAN_FACT_ID)) {
        outgoing.push(...eventsForRecordedFact(createGuardianDefeatedFact(state)));
      }
    }
    if (event.type === 'COMBAT_LOST' && isBossEncounter(event.combatId) && !state.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED]) {
      outgoing.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_GUARDIAN_LOST, value: true });
    }
    if (event.type === 'EXPLORATION_POINT_COMPLETED' && event.pointId === 'royal_magic_stone' && !state.world.flags[WORLD_FLAG.ROYAL_STONE_DISCOVERED]) {
      outgoing.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.ROYAL_STONE_DISCOVERED, value: true });
    }
  }
  return outgoing;
}

function discoveryEvents(state: Readonly<GameState>, locationId: string): GameEvent[] {
  if (state.world.locations[locationId]?.discovered) {
    return [];
  }
  const events: GameEvent[] = [{ type: 'LOCATION_DISCOVERED', locationId }];
  if (locationId === LOCATION_ID.ANCIENT_RUINS && !state.world.facts.some((fact) => fact.id === ruinsDiscoveryFactId(locationId))) {
    events.push(...eventsForRecordedFact(createLocationDiscoveredFact(state, locationId)));
  }
  return events;
}

function ruinsDiscoveryFactId(locationId: string): string {
  return `fact_location_discovered_${locationId}`;
}

function createLocationDiscoveredFact(state: Readonly<GameState>, locationId: string): WorldFact {
  const definition = getLocationDefinition(locationId);
  return {
    id: ruinsDiscoveryFactId(locationId),
    type: 'LOCATION_DISCOVERED',
    occurredAtTurn: state.world.turn,
    locationId: state.world.currentLocationId,
    actorIds: ['player'],
    targetIds: [locationId],
    witnessIds: ['player'],
    tags: ['location', 'discovery'],
    publicLevel: 'PRIVATE',
    payload: { locationId, name: definition?.name ?? locationId },
  };
}

function createGuardianDefeatedFact(state: Readonly<GameState>): WorldFact {
  const presentNpcs = Object.values(state.npcs)
    .filter((npc) => npc.locationId === state.world.currentLocationId)
    .map((npc) => npc.id);
  return {
    id: RUINS_GUARDIAN_FACT_ID,
    type: 'IMPORTANT_EVENT',
    occurredAtTurn: state.world.turn,
    locationId: state.world.currentLocationId,
    actorIds: ['player'],
    targetIds: ['ruins_guardian_001'],
    witnessIds: ['player', ...presentNpcs],
    tags: ['boss', 'ruins', 'guardian'],
    publicLevel: 'PRIVATE',
    payload: { eventKey: 'ruins_guardian_defeated', combatId: ENCOUNTER_ID.RUINS_BOSS_01 },
  };
}

function isRuinsEncounter(combatId: string): boolean {
  return (
    combatId === ENCOUNTER_ID.RUINS_MIXED_01 ||
    combatId === ENCOUNTER_ID.RUINS_EASY_01 ||
    combatId === ENCOUNTER_ID.RUINS_HEAVY_01 ||
    combatId === 'combat_goblin_ruins_01'
  );
}
