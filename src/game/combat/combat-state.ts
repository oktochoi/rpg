import type { EncounterId } from '../core/ids';

/**
 * Temporary runtime state owned by Phaser during combat only.
 * Must not include NPC, Quest, World, or Story fields.
 * Phaser must not write these fields onto GameState.
 */
export interface CombatState {
  isActive: boolean;
  encounterId: EncounterId;
}
