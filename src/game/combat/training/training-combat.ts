import { ENCOUNTER_ID } from '../encounters/encounter-definitions';

/** Training-grounds combat — Phaser session only; does not mutate lasting PlayerState rewards. */
export const TRAINING_COMBAT_ID = ENCOUNTER_ID.TRAINING_GROUNDS;

export function isTrainingCombatId(combatId: string | null | undefined): boolean {
  return combatId === TRAINING_COMBAT_ID || combatId === ENCOUNTER_ID.TRAINING_GROUNDS;
}
