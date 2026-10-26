import type { GameState } from '../../core/game-state';
import { PLAYER_CLASS_ID, type PlayerClassId } from './class-types';
import { isSpecializedClassId } from './class-definitions';
import { WORLD_FLAG } from '../../world/locations/location-definitions';
import { worldFlag } from '../../world/locations/location-selectors';

/**
 * First job change opens after Chapter 1 is finished, at the guild.
 */
export const FIRST_ADVANCEMENT_LEVEL = 1;

export function isAdventurer(classId: string): boolean {
  return classId === PLAYER_CLASS_ID.ADVENTURER || classId === 'wanderer';
}

export function canChooseFirstAdvancement(state: Readonly<GameState>): boolean {
  if (!isAdventurer(state.player.classId) || isSpecializedClassId(state.player.classId)) {
    return false;
  }
  if (worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)) {
    return false;
  }
  if (!worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
    return false;
  }
  return worldFlag(state, WORLD_FLAG.CHAPTER_1_COMPLETE);
}

export function firstAdvancementTargetClass(classId: string): PlayerClassId | null {
  if (classId === PLAYER_CLASS_ID.WARRIOR || classId === PLAYER_CLASS_ID.MAGE || classId === PLAYER_CLASS_ID.ROGUE) {
    return classId;
  }
  return null;
}
