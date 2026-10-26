export const ENEMY_TYPE_ID = {
  GOBLIN: 'goblin',
  ARCHER: 'archer',
  BRUTE: 'brute',
  GOBLIN_MAGE: 'goblin_mage',
  DIRE_WOLF: 'dire_wolf',
  TRAINING_DUMMY: 'training_dummy',
} as const;

export type EnemyTypeId = (typeof ENEMY_TYPE_ID)[keyof typeof ENEMY_TYPE_ID];

export const ENEMY_BEHAVIOR_TYPE = {
  MELEE: 'MELEE',
  RANGED: 'RANGED',
  HEAVY_MELEE: 'HEAVY_MELEE',
  IDLE: 'IDLE',
} as const;

export type EnemyBehaviorType = (typeof ENEMY_BEHAVIOR_TYPE)[keyof typeof ENEMY_BEHAVIOR_TYPE];

export interface EnemyDefinition {
  id: EnemyTypeId;
  name: string;
  maxHp: number;
  moveSpeed: number;
  damage: number;
  attackRange: number;
  attackCooldownMs: number;
  behaviorType: EnemyBehaviorType;
  size: number;
  color: number;
  telegraphMs: number;
  attackDurationMs: number;
  hitStartMs: number;
  hitEndMs: number;
  hitboxWidth: number;
  hitboxHeight: number;
  hitboxOffset: number;
  preferredDistanceMin?: number;
  preferredDistanceMax?: number;
  projectileSpeed?: number;
  projectileLifetimeMs?: number;
  projectileRadius?: number;
  lungeRange?: number;
  lungeSpeed?: number;
  chargeRangeMin?: number;
  chargeRangeMax?: number;
  chargeSpeed?: number;
  chargeWindupMs?: number;
  chargeDurationMs?: number;
  chargeRecoveryMs?: number;
  predictionFactor?: number;
  maxRetreatDistance?: number;
  knockbackResist?: number;
  stunLockImmune?: boolean;
  /** Training dummies: reset to full HP instead of dying. */
  respawnOnDeath?: boolean;
}

export function isEnemyTypeId(value: string): value is EnemyTypeId {
  return (Object.values(ENEMY_TYPE_ID) as string[]).includes(value);
}
