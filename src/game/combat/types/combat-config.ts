import type { EncounterId } from '../../core/ids';

export interface CombatEnemyConfig {
  id: string;
  type: string;
  maxHp: number;
  damage: number;
}

/**
 * Snapshot passed into Phaser at combat start.
 * Must not include Story / NPC / Quest / World GameState.
 */
export interface CombatConfig {
  combatId: EncounterId;
  encounterId: string;
  player: {
    classId: string;
    maxHp: number;
    currentHp: number;
    maxMp: number;
    currentMp: number;
    moveSpeed: number;
    /** Added to basic-attack profile damage before percent scale. */
    attackBonus?: number;
    /** Multiplies (basic damage + attackBonus). */
    attackPercent?: number;
    /** Scales melee hitbox size/offset and projectile lifetime. */
    attackRangeScale?: number;
    healingPotions?: number;
  };
  enemies: CombatEnemyConfig[];
  arenaId: string;
  spawnBias?: 'default' | 'observed';
  /** Village training yard — infinite resources, no lasting PlayerState side effects. */
  training?: boolean;
  /** Already cleared, or the training yard. Skips the long entrance lock. */
  repeatEncounter?: boolean;
}
