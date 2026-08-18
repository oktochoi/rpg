import { BOSS_PATTERN_ID, type BossProjectileShot } from '../boss-types';
import { RUINS_GUARDIAN_CONFIG } from '../boss-config';
import {
  directionTo,
  rotateDirection,
  type BossPattern,
  type BossPatternContext,
  type BossPatternStatus,
} from './boss-pattern-types';

export class ProjectileBurstPattern implements BossPattern {
  readonly id = BOSS_PATTERN_ID.PROJECTILE_BURST;
  private elapsed = 0;
  private fired = false;
  private variant: 0 | 1 | 2 = 0;
  private readonly windUp = RUINS_GUARDIAN_CONFIG.projectileBurst.windUpMs;
  private readonly recovery = RUINS_GUARDIAN_CONFIG.projectileBurst.recoveryMs;

  canUse(_ctx: BossPatternContext): boolean {
    return true;
  }

  start(ctx: BossPatternContext): void {
    this.elapsed = 0;
    this.fired = false;
    const dir = directionTo(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    ctx.lockDirection(dir.x, dir.y);
    ctx.setVelocity(0, 0);
    ctx.setState('WINDUP');
    ctx.showTelegraph('burst');
    ctx.setHitboxActive(false, 'slam');
  }

  update(deltaMs: number, ctx: BossPatternContext): BossPatternStatus {
    this.elapsed += deltaMs;
    ctx.setVelocity(0, 0);
    if (this.elapsed < this.windUp) {
      ctx.setState('WINDUP');
      ctx.showTelegraph('burst');
      return 'running';
    }
    if (!this.fired) {
      this.fired = true;
      ctx.setState('ATTACKING');
      ctx.hideTelegraph();
      ctx.fireProjectiles(this.buildShots(ctx));
    }
    if (this.elapsed < this.windUp + this.recovery) {
      ctx.setState('RECOVERY');
      return 'running';
    }
    this.cancel(ctx);
    return 'done';
  }

  cancel(ctx: BossPatternContext): void {
    ctx.hideTelegraph();
    ctx.setVelocity(0, 0);
  }

  destroy(): void {
    this.elapsed = 0;
    this.fired = false;
    this.variant = ((this.variant + 1) % 3) as 0 | 1 | 2;
  }

  private buildShots(ctx: BossPatternContext): BossProjectileShot[] {
    const config = RUINS_GUARDIAN_CONFIG.projectileBurst;
    let angles: readonly number[] = ctx.phase === 2 ? config.anglesPhase2 : config.anglesPhase1;
    if (ctx.phase === 2 && this.variant === 1) {
      angles = [-20, 0, 20];
    } else if (this.variant === 2) {
      const predicted = directionTo(
        ctx.x,
        ctx.y,
        ctx.playerX + (ctx.playerVx ?? 0) * 8,
        ctx.playerY + (ctx.playerVy ?? 0) * 8
      );
      ctx.lockDirection(predicted.x, predicted.y);
      angles = ctx.phase === 2 ? [-16, 0, 16] : [-10, 10];
    }
    const aim = ctx.getLockedDirection();
    const originX = ctx.x + aim.x * (ctx.size / 2 + 8);
    const originY = ctx.y + aim.y * (ctx.size / 2 + 8);
    return angles.map((offset) => {
      const dir = rotateDirection(aim.x, aim.y, offset);
      return {
        originX,
        originY,
        dirX: dir.x,
        dirY: dir.y,
        speed: config.speed,
        damage: config.damage,
        lifetimeMs: config.lifetimeMs,
        radius: config.radius,
        sourceId: ctx.sourceId,
      };
    });
  }
}
