import type { EnemyDefinition } from '../enemy-types';

export interface EnemyBehaviorContext {
  x: number;
  y: number;
  playerX: number;
  playerY: number;
  playerVx: number;
  playerVy: number;
  homeX: number;
  homeY: number;
  distance: number;
  isPlayerAlive: boolean;
  isAttacking: boolean;
  knockbackActive: boolean;
  moveSpeed: number;
  definition: EnemyDefinition;
  formationIndex: number;
  aliveCount: number;
  hasMeleeToken: boolean;
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
  const count = Math.max(1, ctx.aliveCount);
  const t = count === 1 ? 0.5 : ctx.formationIndex / (count - 1);
  const angleOffset = (t - 0.5) * (Math.PI / 2);
  const toEnemy = directionToward(ctx.playerX, ctx.playerY, ctx.x, ctx.y);
  const base = Math.atan2(toEnemy.y, toEnemy.x);
  const angle = base + angleOffset;
  return {
    x: ctx.playerX + Math.cos(angle) * radius,
    y: ctx.playerY + Math.sin(angle) * radius,
  };
}
