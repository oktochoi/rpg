import { ENEMY_BEHAVIOR_TYPE } from '../enemy-types';
import {
  directionToward,
  surroundOffset,
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

    const caster = ctx.definition.id === 'goblin_mage';
    const min = ctx.definition.preferredDistanceMin ?? 200;
    const max = ctx.definition.preferredDistanceMax ?? 300;
    const dir = directionToward(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    const homeDist = Math.hypot(ctx.x - ctx.homeX, ctx.y - ctx.homeY);
    const maxRetreat = ctx.definition.maxRetreatDistance ?? 150;
    const closingSpeed = ctx.playerVx * dir.x + ctx.playerVy * dir.y;
    const ideal = (min + max) * 0.5;
    const flank = surroundOffset(ctx, ideal);
    const toFlank = directionToward(ctx.x, ctx.y, flank.x, flank.y);
    const goal = { goalX: flank.x, goalY: flank.y, needsLos: ctx.pathClear === false };

    if (ctx.pathClear === false) {
      return { vx: 0, vy: 0, ...goal };
    }

    if (caster && ctx.distance < min) {
      return { vx: -dir.x * ctx.moveSpeed * 0.65, vy: -dir.y * ctx.moveSpeed * 0.65, ...goal };
    }
    if (caster && ctx.distance > max) {
      return { vx: dir.x * ctx.moveSpeed * 0.5, vy: dir.y * ctx.moveSpeed * 0.5, ...goal };
    }

    // Player rushing in — kite hard and sideways.
    if (!caster && (ctx.distance < min || (ctx.distance < ideal && closingSpeed > 80))) {
      if (homeDist >= maxRetreat) {
        const sideX = -dir.y;
        const sideY = dir.x;
        const sign = ctx.formationIndex % 2 === 0 ? 1 : -1;
        return {
          vx: (sideX * sign - dir.x * 0.35) * ctx.moveSpeed * 1.05,
          vy: (sideY * sign - dir.y * 0.35) * ctx.moveSpeed * 1.05,
          ...goal,
        };
      }
      return {
        vx: (-dir.x + toFlank.x * 0.25) * ctx.moveSpeed * 1.1,
        vy: (-dir.y + toFlank.y * 0.25) * ctx.moveSpeed * 1.1,
        ...goal,
      };
    }

    if (ctx.distance > max) {
      return { vx: dir.x * ctx.moveSpeed, vy: dir.y * ctx.moveSpeed, ...goal };
    }

    if (caster) {
      return { vx: 0, vy: 0, ...goal };
    }

    // Comfort band: keep strafing while aiming — never stand still.
    const sign = ctx.formationIndex % 2 === 0 ? 1 : -1;
    const sideX = -dir.y * sign + toFlank.x * 0.4;
    const sideY = dir.x * sign + toFlank.y * 0.4;
    const mag = Math.hypot(sideX, sideY) || 1;
    const drift = ctx.distance < ideal ? -0.12 : 0.08;
    return {
      vx: (sideX / mag) * ctx.moveSpeed * 0.32 + dir.x * drift * ctx.moveSpeed,
      vy: (sideY / mag) * ctx.moveSpeed * 0.32 + dir.y * drift * ctx.moveSpeed,
      ...goal,
    };
  }

  shouldStartAttack(ctx: EnemyBehaviorContext): boolean {
    const min = ctx.definition.preferredDistanceMin ?? 200;
    const max = ctx.definition.preferredDistanceMax ?? 300;
    return (
      ctx.isPlayerAlive &&
      !ctx.isAttacking &&
      ctx.pathClear !== false &&
      ctx.distance >= min &&
      ctx.distance <= max + 40
    );
  }
}
