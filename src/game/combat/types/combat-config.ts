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
    attackBonus?: number;
  };
  enemies: CombatEnemyConfig[];
  arenaId: string;
}
