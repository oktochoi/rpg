import { ENEMY_BEHAVIOR_TYPE } from '../enemy-types';
import {
  directionToward,
  surroundOffset,
  type EnemyBehavior,
  type EnemyBehaviorContext,
  type EnemyMoveCommand,
} from './behavior-types';

export class MeleeBehavior implements EnemyBehavior {
  readonly type = ENEMY_BEHAVIOR_TYPE.MELEE;

  chooseMove(ctx: EnemyBehaviorContext): EnemyMoveCommand {
    if (!ctx.isPlayerAlive || ctx.isAttacking || ctx.knockbackActive) {
      return { vx: 0, vy: 0 };
    }
    const target = surroundOffset(ctx, 36);
    const dir = directionToward(ctx.x, ctx.y, target.x, target.y);
    if (dir.dist <= ctx.definition.attackRange) {
      return { vx: 0, vy: 0 };
    }
    return { vx: dir.x * ctx.moveSpeed, vy: dir.y * ctx.moveSpeed };
  }

  shouldStartAttack(ctx: EnemyBehaviorContext): boolean {
    return ctx.isPlayerAlive && !ctx.isAttacking && ctx.distance <= ctx.definition.attackRange;
  }
}
