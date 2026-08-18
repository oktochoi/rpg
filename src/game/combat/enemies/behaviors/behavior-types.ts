import type { EnemyDefinition } from '../enemy-types';

export interface EnemyBehaviorContext {
  x: number;
  y: number;
  playerX: number;
  playerY: number;
  distance: number;
  isPlayerAlive: boolean;
  isAttacking: boolean;
  knockbackActive: boolean;
  moveSpeed: number;
  definition: EnemyDefinition;
  formationIndex: number;
  aliveCount: number;
}

export interface EnemyMoveCommand {
  vx: number;
  vy: number;
}

export interface EnemyBehavior {
  readonly type: EnemyDefinition['behaviorType'];
  chooseMove(ctx: EnemyBehaviorContext): EnemyMoveCommand;
  shouldStartAttack(ctx: EnemyBehaviorContext): boolean;
}

export function directionToward(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number; dist: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.001) {
    return { x: 0, y: 0, dist: 0 };
  }
  return { x: dx / dist, y: dy / dist, dist };
}

export function surroundOffset(ctx: EnemyBehaviorContext, radius: number): { x: number; y: number } {
  const spread = ctx.formationIndex - (ctx.aliveCount - 1) / 2;
  const { x, y } = directionToward(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
  const px = -y;
  const py = x;
  return {
    x: ctx.playerX + px * spread * radius,
    y: ctx.playerY + py * spread * radius,
  };
}
