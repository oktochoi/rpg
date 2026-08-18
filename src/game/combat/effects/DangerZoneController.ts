import * as Phaser from 'phaser';
import { COMBAT_DEPTH } from '../visual/combat-depth';

export interface DangerZoneConfig {
  x: number;
  y: number;
  radius: number;
  durationMs: number;
  tickMs: number;
  damage: number;
  color?: number;
}

interface LiveZone {
  x: number;
  y: number;
  radius: number;
  remainingMs: number;
  tickMs: number;
  tickAcc: number;
  damage: number;
  attackId: number;
  visual: Phaser.GameObjects.Arc;
}

export class DangerZoneController {
  private readonly zones: LiveZone[] = [];
  private nextAttackId = 80_000;

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  spawn(config: DangerZoneConfig): void {
    const visual = this.scene.add.circle(config.x, config.y, config.radius, config.color ?? 0x7a4aaa, 0.22);
    visual.setStrokeStyle(2, config.color ?? 0xc89ad8, 0.8);
    visual.setDepth(COMBAT_DEPTH.telegraph);
    this.zones.push({
      x: config.x,
      y: config.y,
      radius: config.radius,
      remainingMs: config.durationMs,
      tickMs: Math.max(180, config.tickMs),
      tickAcc: config.tickMs,
      damage: config.damage,
      attackId: this.nextAttackId,
      visual,
    });
    this.nextAttackId += 1;
  }

  update(
    deltaMs: number,
    player: { x: number; y: number; radius: number; isInvincible: boolean } | undefined,
    onHit?: (damage: number, attackId: number, dirX: number, dirY: number) => void
  ): void {
    for (let index = this.zones.length - 1; index >= 0; index -= 1) {
      const zone = this.zones[index];
      zone.remainingMs -= deltaMs;
      zone.tickAcc += deltaMs;
      const fade = Math.max(0.12, zone.remainingMs / 1600);
      zone.visual.setAlpha(fade);
      if (player && !player.isInvincible) {
        const dist = Math.hypot(player.x - zone.x, player.y - zone.y);
        if (dist <= zone.radius + player.radius && zone.tickAcc >= zone.tickMs) {
          zone.tickAcc = 0;
          const dx = player.x - zone.x;
          const dy = player.y - zone.y;
          onHit?.(zone.damage, zone.attackId, dx, dy);
        }
      }
      if (zone.remainingMs <= 0) {
        zone.visual.destroy();
        this.zones.splice(index, 1);
      }
    }
  }

  clear(): void {
    for (const zone of this.zones) {
      zone.visual.destroy();
    }
    this.zones.length = 0;
  }

  private destroy = (): void => {
    this.clear();
  };
}
