import type { EncounterId } from '../../core/ids';

export type CombatOutcome = 'VICTORY' | 'DEFEAT';

export const COMBAT_RESULT_EVENT = 'combat-result';

/**
 * Result returned by Phaser. Contains no Story processing logic.
 */
export interface CombatResult {
  combatId: EncounterId;
  outcome: CombatOutcome;
  player: {
    remainingHp: number;
    remainingMp?: number;
  };
  defeatedEnemyIds: string[];
  defeatedEnemyTypes?: string[];
  escapedEnemyIds?: string[];
}
