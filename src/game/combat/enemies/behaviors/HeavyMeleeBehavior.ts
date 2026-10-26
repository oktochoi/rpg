import { ENEMY_BEHAVIOR_TYPE } from '../enemy-types';
import {
  directionToward,
  surroundOffset,
  type EnemyBehavior,
  type EnemyMoveCommand,
  type EnemyBehaviorContext,
} from './behavior-types';

export class HeavyMeleeBehavior implements EnemyBehavior {
  readonly type = ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE;

  chooseMove(ctx: EnemyBehaviorContext): EnemyMoveCommand {
    if (!ctx.isPlayerAlive || ctx.isAttacking || ctx.knockbackActive) {
      return { vx: 0, vy: 0 };
    }

    const chargeMin = ctx.definition.chargeRangeMin ?? 130;
    const chargeMax = ctx.definition.chargeRangeMax ?? 300;
    const leadX = ctx.playerX + ctx.playerVx * 0.28;
    const leadY = ctx.playerY + ctx.playerVy * 0.28;
    const toLead = directionToward(ctx.x, ctx.y, leadX, leadY);
    const toPlayer = directionToward(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    const inChargeBand = ctx.distance >= chargeMin && ctx.distance <= chargeMax;
    const slot = surroundOffset({ ...ctx, playerX: leadX, playerY: leadY }, Math.max(56, ctx.definition.attackRange * 0.9));
    const goal = { goalX: slot.x, goalY: slot.y };

    if (ctx.distance <= ctx.definition.attackRange) {
      return { vx: 0, vy: 0, ...goal, hold: true };
    }

    if (inChargeBand && ctx.pathClear === false) {
      const sign = ctx.formationIndex % 2 === 0 ? 1 : -1;
      return {
        vx: -toPlayer.y * sign * ctx.moveSpeed * 0.95,
        vy: toPlayer.x * sign * ctx.moveSpeed * 0.95,
        ...goal,
      };
    }

    // Outside charge band but far: march toward predicted position.
    if (ctx.distance > chargeMax) {
      return { vx: toLead.x * ctx.moveSpeed * 1.05, vy: toLead.y * ctx.moveSpeed * 1.05, ...goal };
    }

    // Mid-close: walk in for a slam, slight surround so multiple brutes don't stack.
    const dir = directionToward(ctx.x, ctx.y, slot.x, slot.y);
    return { vx: dir.x * ctx.moveSpeed, vy: dir.y * ctx.moveSpeed, ...goal };
  }

  shouldStartAttack(ctx: EnemyBehaviorContext): boolean {
    if (!ctx.isPlayerAlive || ctx.isAttacking || !ctx.hasMeleeToken) {
      return false;
    }
    const chargeMin = ctx.definition.chargeRangeMin ?? 130;
    const chargeMax = ctx.definition.chargeRangeMax ?? 300;
    if (ctx.distance <= ctx.definition.attackRange * 1.08) {
      return true;
    }
    // Charge when player is in the band and not obscured — lead the aim in controller.
    return ctx.pathClear !== false && ctx.distance >= chargeMin * 0.92 && ctx.distance <= chargeMax;
  }
}
