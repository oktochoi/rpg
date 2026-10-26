import { ENEMY_BEHAVIOR_TYPE } from '../enemy-types';
import type { EnemyBehavior, EnemyBehaviorContext, EnemyMoveCommand } from './behavior-types';

/** Stationary dummy — no chase, no attacks. */
export class IdleBehavior implements EnemyBehavior {
  readonly type = ENEMY_BEHAVIOR_TYPE.IDLE;

  chooseMove(_ctx: EnemyBehaviorContext): EnemyMoveCommand {
    return { vx: 0, vy: 0 };
  }

  shouldStartAttack(_ctx: EnemyBehaviorContext): boolean {
    return false;
  }
}
