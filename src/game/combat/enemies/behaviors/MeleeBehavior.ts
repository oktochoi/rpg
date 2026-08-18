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
    const target = surroundOffset(ctx, 48);
    const dir = directionToward(ctx.x, ctx.y, target.x, target.y);
    if (dir.dist <= 10) {
      return { vx: 0, vy: 0 };
    }
    const speed = ctx.hasMeleeToken ? ctx.moveSpeed : ctx.moveSpeed * 0.72;
    return { vx: dir.x * speed, vy: dir.y * speed };
  }

  shouldStartAttack(ctx: EnemyBehaviorContext): boolean {
    if (!ctx.isPlayerAlive || ctx.isAttacking || !ctx.hasMeleeToken) {
      return false;
    }
    const lungeRange = ctx.definition.lungeRange ?? ctx.definition.attackRange;
    return ctx.distance <= lungeRange;
  }
}
