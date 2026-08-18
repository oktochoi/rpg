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
  }

  private buildShots(ctx: BossPatternContext): BossProjectileShot[] {
    const config = RUINS_GUARDIAN_CONFIG.projectileBurst;
    const angles = ctx.phase === 2 ? config.anglesPhase2 : config.anglesPhase1;
    const locked = ctx.getLockedDirection();
    const originX = ctx.x + locked.x * (ctx.size / 2 + 8);
    const originY = ctx.y + locked.y * (ctx.size / 2 + 8);
    return angles.map((offset) => {
      const dir = rotateDirection(locked.x, locked.y, offset);
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
