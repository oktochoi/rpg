import { BOSS_PATTERN_ID } from '../boss-types';
import { RUINS_GUARDIAN_CONFIG } from '../boss-config';
import { directionTo, type BossPattern, type BossPatternContext, type BossPatternStatus } from './boss-pattern-types';

export class ChargePattern implements BossPattern {
  readonly id = BOSS_PATTERN_ID.CHARGE;
  private elapsed = 0;
  private readonly windUp = RUINS_GUARDIAN_CONFIG.charge.windUpMs;
  private readonly duration = RUINS_GUARDIAN_CONFIG.charge.durationMs;
  private readonly recovery = RUINS_GUARDIAN_CONFIG.charge.recoveryMs;

  canUse(_ctx: BossPatternContext): boolean {
    return true;
  }

  start(ctx: BossPatternContext): void {
    this.elapsed = 0;
    const dir = directionTo(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    ctx.lockDirection(dir.x, dir.y);
    ctx.setVelocity(0, 0);
    ctx.setState('WINDUP');
    ctx.showTelegraph('charge');
    ctx.setHitboxActive(false, 'charge');
  }

  update(deltaMs: number, ctx: BossPatternContext): BossPatternStatus {
    this.elapsed += deltaMs;
    if (this.elapsed < this.windUp) {
      ctx.setVelocity(0, 0);
      ctx.setState('WINDUP');
      ctx.showTelegraph('charge');
      ctx.setHitboxActive(false, 'charge');
      return 'running';
    }
    if (this.elapsed < this.windUp + this.duration) {
      ctx.setState('ATTACKING');
      ctx.hideTelegraph();
      ctx.setHitboxActive(true, 'charge');
      const speed = ctx.phase === 2 ? RUINS_GUARDIAN_CONFIG.charge.phase2Speed : RUINS_GUARDIAN_CONFIG.charge.speed;
      const dir = ctx.getLockedDirection();
      ctx.setVelocity(dir.x * speed, dir.y * speed);
      const hitBound = ctx.clampToArena();
      if (hitBound) {
        this.elapsed = this.windUp + this.duration;
        ctx.setVelocity(0, 0);
        ctx.setHitboxActive(false, 'charge');
      }
      return 'running';
    }
    if (this.elapsed < this.windUp + this.duration + this.recovery) {
      ctx.setVelocity(0, 0);
      ctx.setState('RECOVERY');
      ctx.setHitboxActive(false, 'charge');
      ctx.hideTelegraph();
      return 'running';
    }
    this.cancel(ctx);
    return 'done';
  }

  cancel(ctx: BossPatternContext): void {
    ctx.hideTelegraph();
    ctx.setHitboxActive(false, 'charge');
    ctx.setVelocity(0, 0);
  }

  destroy(): void {
    this.elapsed = 0;
  }
}
