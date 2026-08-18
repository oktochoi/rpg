import type { BossPatternId, BossProjectileShot } from '../boss-types';

export interface BossPatternContext {
  x: number;
  y: number;
  playerX: number;
  playerY: number;
  playerVx?: number;
  playerVy?: number;
  width: number;
  height: number;
  originX?: number;
  originY?: number;
  size: number;
  phase: 1 | 2;
  lockDirection(dirX: number, dirY: number): void;
  getLockedDirection(): { x: number; y: number };
  setVelocity(vx: number, vy: number): void;
  setState(state: 'WINDUP' | 'ATTACKING' | 'RECOVERY'): void;
  showTelegraph(kind: 'slam' | 'burst' | 'charge'): void;
  hideTelegraph(): void;
  setHitboxActive(active: boolean, kind: 'slam' | 'charge'): void;
  fireProjectiles(shots: readonly BossProjectileShot[]): void;
  spawnResidue?(x: number, y: number): void;
  clampToArena(): boolean;
  sourceId: string;
}

export type BossPatternStatus = 'running' | 'done';

export interface BossPattern {
  readonly id: BossPatternId;
  canUse(ctx: BossPatternContext): boolean;
  start(ctx: BossPatternContext): void;
  update(deltaMs: number, ctx: BossPatternContext): BossPatternStatus;
  cancel(ctx: BossPatternContext): void;
  destroy(): void;
}

export function directionTo(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.001) {
    return { x: 1, y: 0 };
  }
  return { x: dx / dist, y: dy / dist };
}

export function rotateDirection(dirX: number, dirY: number, degrees: number): { x: number; y: number } {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: dirX * cos - dirY * sin,
    y: dirX * sin + dirY * cos,
  };
}
