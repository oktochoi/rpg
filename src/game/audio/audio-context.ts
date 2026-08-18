import { isBossEncounter } from '../combat/encounters/encounter-definitions';
import { getLocationDefinition } from '../world/locations/location-definitions';
import { BGM_CONTEXT, type BgmContextId } from './audio-types';

export function bgmContextForLocation(locationId: string): BgmContextId {
  const definition = getLocationDefinition(locationId);
  if (definition?.audioTheme === BGM_CONTEXT.STORY_MYSTERY || definition?.audioTheme === BGM_CONTEXT.STORY_SAFE) {
    return definition.audioTheme;
  }
  const type = definition?.type;
  if (type === 'ROAD' || type === 'FOREST' || type === 'RUINS' || type === 'DUNGEON') {
    return BGM_CONTEXT.STORY_MYSTERY;
  }
  return BGM_CONTEXT.STORY_SAFE;
}

export function bgmContextForCombat(encounterId: string): BgmContextId {
  return isBossEncounter(encounterId) ? BGM_CONTEXT.COMBAT_BOSS : BGM_CONTEXT.COMBAT_NORMAL;
}

export function bgmContextForCombatResult(outcome: 'VICTORY' | 'DEFEAT'): BgmContextId {
  return outcome === 'VICTORY' ? BGM_CONTEXT.VICTORY : BGM_CONTEXT.DEFEAT;
}
