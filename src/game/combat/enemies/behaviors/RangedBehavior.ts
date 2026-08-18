import { ENEMY_BEHAVIOR_TYPE } from '../enemy-types';
import {
  directionToward,
  type EnemyBehavior,
  type EnemyBehaviorContext,
  type EnemyMoveCommand,
} from './behavior-types';

export class RangedBehavior implements EnemyBehavior {
  readonly type = ENEMY_BEHAVIOR_TYPE.RANGED;

  chooseMove(ctx: EnemyBehaviorContext): EnemyMoveCommand {
    if (!ctx.isPlayerAlive || ctx.isAttacking || ctx.knockbackActive) {
      return { vx: 0, vy: 0 };
    }
    const min = ctx.definition.preferredDistanceMin ?? 220;
    const max = ctx.definition.preferredDistanceMax ?? 320;
    const dir = directionToward(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    if (ctx.distance > max) {
      return { vx: dir.x * ctx.moveSpeed, vy: dir.y * ctx.moveSpeed };
    }
    if (ctx.distance < min) {
      return { vx: -dir.x * ctx.moveSpeed, vy: -dir.y * ctx.moveSpeed };
    }
    return { vx: 0, vy: 0 };
  }

  shouldStartAttack(ctx: EnemyBehaviorContext): boolean {
    const min = ctx.definition.preferredDistanceMin ?? 220;
    const max = ctx.definition.preferredDistanceMax ?? 320;
    return (
      ctx.isPlayerAlive &&
      !ctx.isAttacking &&
      ctx.distance >= min * 0.55 &&
      ctx.distance <= max + 40
    );
  }
}
