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
    const min = ctx.definition.preferredDistanceMin ?? 200;
    const max = ctx.definition.preferredDistanceMax ?? 300;
    const dir = directionToward(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    const homeDist = Math.hypot(ctx.x - ctx.homeX, ctx.y - ctx.homeY);
    const maxRetreat = ctx.definition.maxRetreatDistance ?? 150;
    if (ctx.distance > max) {
      return { vx: dir.x * ctx.moveSpeed, vy: dir.y * ctx.moveSpeed };
    }
    if (ctx.distance < min) {
      if (homeDist >= maxRetreat) {
        const sideX = -dir.y;
        const sideY = dir.x;
        return { vx: sideX * ctx.moveSpeed * 0.85, vy: sideY * ctx.moveSpeed * 0.85 };
      }
      return { vx: -dir.x * ctx.moveSpeed, vy: -dir.y * ctx.moveSpeed };
    }
    const sideX = -dir.y;
    const sideY = dir.x;
    return { vx: sideX * ctx.moveSpeed * 0.25, vy: sideY * ctx.moveSpeed * 0.25 };
  }

  shouldStartAttack(ctx: EnemyBehaviorContext): boolean {
    const min = ctx.definition.preferredDistanceMin ?? 200;
    const max = ctx.definition.preferredDistanceMax ?? 300;
    return (
      ctx.isPlayerAlive &&
      !ctx.isAttacking &&
      ctx.distance >= min * 0.55 &&
      ctx.distance <= max + 40
    );
  }
}
