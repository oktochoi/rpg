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

    const leadX = ctx.playerX + ctx.playerVx * 0.22;
    const leadY = ctx.playerY + ctx.playerVy * 0.22;
    const toLead = directionToward(ctx.x, ctx.y, leadX, leadY);
    const toPlayer = directionToward(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    const closing = ctx.playerVx * toPlayer.x + ctx.playerVy * toPlayer.y;
    const slot = surroundOffset(
      { ...ctx, playerX: leadX, playerY: leadY },
      Math.max(78, ctx.definition.attackRange + 22)
    );
    const goal = { goalX: slot.x, goalY: slot.y };
    const wolf = ctx.definition.id === 'dire_wolf';

    if (wolf && ctx.distance > ctx.definition.attackRange && ctx.distance < 220) {
      const sign = ctx.formationIndex % 2 === 0 ? 1 : -1;
      const inward = ctx.distance > 130 ? 0.5 : 0.12;
      return {
        vx: (-toPlayer.y * sign * 0.9 + toPlayer.x * inward) * ctx.moveSpeed,
        vy: (toPlayer.x * sign * 0.9 + toPlayer.y * inward) * ctx.moveSpeed,
        ...goal,
      };
    }

    if (ctx.distance <= ctx.definition.attackRange) {
      return { vx: 0, vy: 0, ...goal, hold: true };
    }

    // Token holder: commit — chase predicted position and stay in strike range.
    if (ctx.hasMeleeToken) {
      const strikeBand = Math.max(18, ctx.definition.attackRange * 0.72);
      if (toLead.dist <= strikeBand) {
        // Micro-adjust to stay on the player's flank while winding up.
        const sign = ctx.formationIndex % 2 === 0 ? 1 : -1;
        return {
          vx: -toPlayer.y * sign * ctx.moveSpeed * 0.35,
          vy: toPlayer.x * sign * ctx.moveSpeed * 0.35,
          ...goal,
        };
      }
      const sprint = closing < -40 ? 1.12 : 1;
      return { vx: toLead.x * ctx.moveSpeed * sprint, vy: toLead.y * ctx.moveSpeed * sprint, ...goal };
    }

    // No token: pressure at mid range, cut off retreat, don't idle far away.
    const holdRadius = 72 + (ctx.formationIndex % 3) * 10;
    const flank = surroundOffset({ ...ctx, playerX: leadX, playerY: leadY }, holdRadius);
    const toFlank = directionToward(ctx.x, ctx.y, flank.x, flank.y);
    if (toFlank.dist <= 14) {
      const sign = ctx.formationIndex % 2 === 0 ? 1 : -1;
      return {
        vx: -toPlayer.y * sign * ctx.moveSpeed * 0.7,
        vy: toPlayer.x * sign * ctx.moveSpeed * 0.7,
        ...goal,
      };
    }
    if (ctx.distance < ctx.definition.attackRange * 1.6) {
      return { vx: toFlank.x * ctx.moveSpeed * 0.8, vy: toFlank.y * ctx.moveSpeed * 0.8, ...goal };
    }
    return { vx: toFlank.x * ctx.moveSpeed * 0.92, vy: toFlank.y * ctx.moveSpeed * 0.92, ...goal };
  }

  shouldStartAttack(ctx: EnemyBehaviorContext): boolean {
    if (!ctx.isPlayerAlive || ctx.isAttacking || !ctx.hasMeleeToken) {
      return false;
    }
    const lungeRange = ctx.definition.lungeRange ?? ctx.definition.attackRange;
    // Allow a slightly earlier commit so lunges don't whiff after lead-in.
    return ctx.distance <= lungeRange * 1.05;
  }
}
