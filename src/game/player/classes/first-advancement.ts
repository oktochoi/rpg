import type { GameState } from '../../core/game-state';
import { PLAYER_CLASS_ID, type PlayerClassId } from './class-types';
import { isSpecializedClassId } from './class-definitions';
import { QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { WORLD_FLAG } from '../../world/locations/location-definitions';
import { worldFlag } from '../../world/locations/location-selectors';

export const FIRST_ADVANCEMENT_LEVEL = 5;

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
  if ((state.player.level ?? 1) < FIRST_ADVANCEMENT_LEVEL) {
    return false;
  }
  const mainQuestDone = state.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.COMPLETED;
  return (
    mainQuestDone &&
    worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) &&
    worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE)
  );
}

export function firstAdvancementTargetClass(classId: string): PlayerClassId | null {
  if (classId === PLAYER_CLASS_ID.WARRIOR || classId === PLAYER_CLASS_ID.MAGE || classId === PLAYER_CLASS_ID.ROGUE) {
    return classId;
  }
  return null;
}
