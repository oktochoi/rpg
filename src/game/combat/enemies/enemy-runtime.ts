import type { EnemyDefinition, EnemyTypeId } from './enemy-types';
import type { EnemyBehavior } from './behaviors/behavior-types';

export interface EnemySpawnRequest {
  instanceId: string;
  typeId: EnemyTypeId;
  definition: EnemyDefinition;
  behavior: EnemyBehavior;
  x: number;
  y: number;
}

export interface EnemyRangedShot {
  instanceId: string;
  originX: number;
  originY: number;
  dirX: number;
  dirY: number;
  definition: EnemyDefinition;
}
