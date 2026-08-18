export const ENEMY_TYPE_ID = {
  GOBLIN: 'goblin',
  ARCHER: 'archer',
  BRUTE: 'brute',
} as const;

export type EnemyTypeId = (typeof ENEMY_TYPE_ID)[keyof typeof ENEMY_TYPE_ID];

export const ENEMY_BEHAVIOR_TYPE = {
  MELEE: 'MELEE',
  RANGED: 'RANGED',
  HEAVY_MELEE: 'HEAVY_MELEE',
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
}

export function isEnemyTypeId(value: string): value is EnemyTypeId {
  return (Object.values(ENEMY_TYPE_ID) as string[]).includes(value);
}
