import { ENEMY_BEHAVIOR_TYPE, type EnemyBehaviorType } from '../enemy-types';
import { HeavyMeleeBehavior } from './HeavyMeleeBehavior';
import { IdleBehavior } from './IdleBehavior';
import { MeleeBehavior } from './MeleeBehavior';
import { RangedBehavior } from './RangedBehavior';
import type { EnemyBehavior } from './behavior-types';

export function createEnemyBehavior(type: EnemyBehaviorType): EnemyBehavior {
  if (type === ENEMY_BEHAVIOR_TYPE.IDLE) {
    return new IdleBehavior();
  }
  if (type === ENEMY_BEHAVIOR_TYPE.RANGED) {
    return new RangedBehavior();
  }
  if (type === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE) {
    return new HeavyMeleeBehavior();
  }
  return new MeleeBehavior();
}
