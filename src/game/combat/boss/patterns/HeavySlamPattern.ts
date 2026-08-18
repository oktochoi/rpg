import { BOSS_PATTERN_ID } from '../boss-types';
import { RUINS_GUARDIAN_CONFIG } from '../boss-config';
import { directionTo, type BossPattern, type BossPatternContext, type BossPatternStatus } from './boss-pattern-types';

export class HeavySlamPattern implements BossPattern {
  readonly id = BOSS_PATTERN_ID.HEAVY_SLAM;
  private elapsed = 0;
  private windUp = RUINS_GUARDIAN_CONFIG.heavySlam.windUpMs;
  private readonly active = RUINS_GUARDIAN_CONFIG.heavySlam.activeMs;
  private readonly recovery = RUINS_GUARDIAN_CONFIG.heavySlam.recoveryMs;
  private residueSpawned = false;

  canUse(_ctx: BossPatternContext): boolean {
    return true;
  }

  start(ctx: BossPatternContext): void {
    this.elapsed = 0;
    this.residueSpawned = false;
    this.windUp =
      ctx.phase === 2 ? RUINS_GUARDIAN_CONFIG.heavySlam.phase2WindUpMs : RUINS_GUARDIAN_CONFIG.heavySlam.windUpMs;
    const dir = directionTo(ctx.x, ctx.y, ctx.playerX, ctx.playerY);
    ctx.lockDirection(dir.x, dir.y);
    ctx.setVelocity(0, 0);
    ctx.setState('WINDUP');
    ctx.showTelegraph('slam');
    ctx.setHitboxActive(false, 'slam');
  }

  update(deltaMs: number, ctx: BossPatternContext): BossPatternStatus {
    this.elapsed += deltaMs;
    ctx.setVelocity(0, 0);
    if (this.elapsed < this.windUp) {
      ctx.setState('WINDUP');
      ctx.showTelegraph('slam');
      ctx.setHitboxActive(false, 'slam');
      return 'running';
    }
    if (this.elapsed < this.windUp + this.active) {
      ctx.setState('ATTACKING');
      ctx.showTelegraph('slam');
      ctx.setHitboxActive(true, 'slam');
      return 'running';
    }
    if (this.elapsed < this.windUp + this.active + this.recovery) {
      ctx.setState('RECOVERY');
      ctx.hideTelegraph();
      ctx.setHitboxActive(false, 'slam');
      if (ctx.phase === 2 && !this.residueSpawned) {
        const dir = ctx.getLockedDirection();
        ctx.spawnResidue?.(ctx.x + dir.x * 48, ctx.y + dir.y * 48);
        this.residueSpawned = true;
      }
      return 'running';
    }
    this.cancel(ctx);
    return 'done';
  }

  cancel(ctx: BossPatternContext): void {
    ctx.hideTelegraph();
    ctx.setHitboxActive(false, 'slam');
    ctx.setVelocity(0, 0);
  }

  destroy(): void {
    this.elapsed = 0;
    this.residueSpawned = false;
  }
}
