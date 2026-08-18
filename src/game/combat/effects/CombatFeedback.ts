import * as Phaser from 'phaser';
import { COMBAT_FEEL } from './CombatFeelConfig';
import { COMBAT_DEPTH } from '../visual/combat-depth';
import { GAME_ASSETS, getEffectAsset } from '../visual/asset-registry';

export type CombatEffectId = keyof typeof GAME_ASSETS.EFFECT;

interface WorldPoint {
  x: number;
  y: number;
}

interface TimedVisual {
  object: Phaser.GameObjects.GameObject & {
    x: number;
    y: number;
    setAlpha: (value: number) => unknown;
    destroy: () => void;
  };
  lifetimeMs: number;
  remainingMs: number;
  startY: number;
  risePx: number;
}

export class CombatFeedback {
  private readonly afterImages: TimedVisual[] = [];
  private readonly slashes: TimedVisual[] = [];
  private readonly numbers: TimedVisual[] = [];

  private afterImageSpawnRemainingMs = 0;
  private hitStopUntilMs = 0;

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get isHitStopping(): boolean {
    return this.hitStopUntilMs > 0 && performance.now() < this.hitStopUntilMs;
  }

  playAttackHit(target: WorldPoint, amount: number, options?: { shakeScale?: number; offsetY?: number }): void {
    const strong = amount >= 30;
    this.playHitStop(strong ? COMBAT_FEEL.skillHitStopMs : COMBAT_FEEL.normalHitStopMs);
    const shakeScale = options?.shakeScale ?? 1;
    this.playShake(
      strong ? COMBAT_FEEL.skillShakeDurationMs : COMBAT_FEEL.playerHitShakeDurationMs,
      (strong ? COMBAT_FEEL.skillShakeIntensity : COMBAT_FEEL.playerHitShakeIntensity) * shakeScale
    );
    this.playDamageNumber(target.x, target.y, amount, '#f0d2a8', strong, options?.offsetY);
  }

  playBossDeath(): void {
    this.playHitStop(COMBAT_FEEL.bossDeathHitStopMs);
    this.playShake(COMBAT_FEEL.bossDeathShakeDurationMs, COMBAT_FEEL.bossDeathShakeIntensity);
  }

  playReceivedHit(target: WorldPoint, amount: number, offsetY?: number, heavy = false): void {
    this.playHitStop(heavy ? COMBAT_FEEL.receivedHeavyHitStopMs : COMBAT_FEEL.receivedHitStopMs);
    this.playShake(
      heavy ? COMBAT_FEEL.receivedHeavyShakeDurationMs : COMBAT_FEEL.receivedHitShakeDurationMs,
      heavy ? COMBAT_FEEL.receivedHeavyShakeIntensity : COMBAT_FEEL.receivedHitShakeIntensity
    );
    this.playDamageNumber(target.x, target.y, amount, '#e88a7a', heavy, offsetY);
  }

  playSlash(originX: number, originY: number, direction: Phaser.Math.Vector2, effectId: CombatEffectId = 'slash_basic'): void {
    const x = originX + direction.x * COMBAT_FEEL.slashOffset;
    const y = originY + direction.y * COMBAT_FEEL.slashOffset;
    if (
      this.tryPlaySprite(effectId, x, y, {
        rotation: direction.angle(),
        displayWidth: 86,
        displayHeight: 58,
        originX: 0.2,
        originY: 0.5,
        lifetimeMs: 220,
      })
    ) {
      return;
    }
    const slash = this.scene.add.rectangle(
      x,
      y,
      COMBAT_FEEL.slashLength,
      COMBAT_FEEL.slashThickness,
      COMBAT_FEEL.slashColor,
      0.85
    );
    slash.setRotation(direction.angle());
    slash.setDepth(COMBAT_DEPTH.attackFx);
    this.slashes.push({
      object: slash,
      lifetimeMs: COMBAT_FEEL.slashLifetimeMs,
      remainingMs: COMBAT_FEEL.slashLifetimeMs,
      startY: slash.y,
      risePx: 0,
    });
  }

  playNova(x: number, y: number, radius: number): void {
    if (
      this.tryPlaySprite('frost_nova', x, y, {
        displayWidth: radius * 1.7,
        displayHeight: radius * 1.55,
        originX: 0.5,
        originY: 0.88,
        lifetimeMs: 320,
      })
    ) {
      return;
    }
    const ring = this.scene.add.circle(x, y, radius, 0x7ec8ff, 0.28);
    ring.setStrokeStyle(3, 0xb8e0ff, 0.9);
    ring.setDepth(COMBAT_DEPTH.attackFx);
    this.slashes.push({
      object: ring,
      lifetimeMs: 280,
      remainingMs: 280,
      startY: ring.y,
      risePx: 0,
    });
  }

  playGuardBurst(x: number, y: number, size: number): void {
    const shield = this.scene.add.circle(x, y, size * 0.85, 0xd4c08a, 0.2);
    shield.setStrokeStyle(3, 0xf0e0b0, 0.85);
    shield.setDepth(COMBAT_DEPTH.attackFx);
    this.slashes.push({
      object: shield,
      lifetimeMs: 220,
      remainingMs: 220,
      startY: shield.y,
      risePx: 0,
    });
  }

  playChargeArc(originX: number, originY: number, direction: Phaser.Math.Vector2): void {
    const x = originX + direction.x * 28;
    const y = originY + direction.y * 28;
    if (
      this.tryPlaySprite('slash_charge', x, y, {
        rotation: direction.angle(),
        displayWidth: 110,
        displayHeight: 72,
        originX: 0.18,
        originY: 0.5,
        lifetimeMs: 240,
      })
    ) {
      return;
    }
    const arc = this.scene.add.rectangle(x, y, 52, 10, 0xf5ead0, 0.8);
    arc.setRotation(direction.angle());
    arc.setDepth(COMBAT_DEPTH.attackFx);
    this.slashes.push({
      object: arc,
      lifetimeMs: COMBAT_FEEL.slashLifetimeMs,
      remainingMs: COMBAT_FEEL.slashLifetimeMs,
      startY: arc.y,
      risePx: 0,
    });
  }

  playDashTrail(originX: number, originY: number, direction: Phaser.Math.Vector2): void {
    const x = originX + direction.x * 18;
    const y = originY + direction.y * 18;
    this.tryPlaySprite('shadow_dash', x, y, {
      rotation: direction.angle(),
      displayWidth: 108,
      displayHeight: 42,
      originX: 0.12,
      originY: 0.5,
      lifetimeMs: 200,
    });
  }

  private tryPlaySprite(
    effectId: CombatEffectId,
    x: number,
    y: number,
    options: {
      rotation?: number;
      displayWidth: number;
      displayHeight: number;
      originX?: number;
      originY?: number;
      lifetimeMs: number;
    }
  ): boolean {
    const asset = getEffectAsset(effectId);
    if (!this.scene.textures.exists(asset.textureKey)) {
      return false;
    }
    const image = this.scene.add.image(x, y, asset.textureKey);
    image.setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
    image.setDisplaySize(options.displayWidth, options.displayHeight);
    image.setRotation(options.rotation ?? 0);
    image.setBlendMode('ADD');
    image.setDepth(COMBAT_DEPTH.attackFx);
    this.slashes.push({
      object: image,
      lifetimeMs: options.lifetimeMs,
      remainingMs: options.lifetimeMs,
      startY: image.y,
      risePx: 0,
    });
    return true;
  }

  syncDashAfterImage(
    player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc,
    isDashing: boolean,
    delta: number,
    tint?: number
  ): void {
    if (!isDashing) {
      this.afterImageSpawnRemainingMs = 0;
      return;
    }

    this.afterImageSpawnRemainingMs -= delta;
    if (this.afterImageSpawnRemainingMs > 0) {
      return;
    }

    this.spawnAfterImage(player, tint);
    this.afterImageSpawnRemainingMs = COMBAT_FEEL.dashAfterImageIntervalMs;
  }

  update(delta: number): void {
    this.tickHitStop();
    this.tickVisuals(this.afterImages, delta, false);
    this.tickVisuals(this.slashes, delta, false);
    this.tickVisuals(this.numbers, delta, true);
  }

  private playHitStop(durationMs: number): void {
    const until = performance.now() + durationMs;
    this.hitStopUntilMs = Math.max(this.hitStopUntilMs, until);
    this.scene.physics.world.pause();
  }

  private tickHitStop(): void {
    if (this.hitStopUntilMs <= 0) {
      return;
    }

    if (performance.now() < this.hitStopUntilMs) {
      return;
    }

    this.hitStopUntilMs = 0;
    if (this.scene.physics.world.isPaused) {
      this.scene.physics.world.resume();
    }
  }

  private playShake(durationMs: number, intensity: number): void {
    this.scene.cameras.main.shake(durationMs, intensity);
  }

  private playDamageNumber(x: number, y: number, amount: number, color: string, large = false, offsetY = 18): void {
    const label = this.scene.add.text(x, y - offsetY, `-${amount}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: large || amount >= 30 ? '20px' : '16px',
      color,
      stroke: '#1a1612',
      strokeThickness: 3,
    });
    label.setOrigin(0.5);
    label.setDepth(COMBAT_DEPTH.damageText);
    this.numbers.push({
      object: label,
      lifetimeMs: COMBAT_FEEL.damageNumberLifetimeMs,
      remainingMs: COMBAT_FEEL.damageNumberLifetimeMs,
      startY: label.y,
      risePx: COMBAT_FEEL.damageNumberRisePx,
    });
  }

  private spawnAfterImage(player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc, tint?: number): void {
    const size =
      player instanceof Phaser.GameObjects.Arc ? player.radius * 2 : player.width;
    const ghost = this.scene.add.rectangle(
      player.x,
      player.y,
      size,
      size,
      tint ?? player.fillColor,
      COMBAT_FEEL.dashAfterImageAlpha
    );
    ghost.setDepth(COMBAT_DEPTH.character - 0.5);
    this.afterImages.push({
      object: ghost,
      lifetimeMs: COMBAT_FEEL.dashAfterImageLifetimeMs,
      remainingMs: COMBAT_FEEL.dashAfterImageLifetimeMs,
      startY: ghost.y,
      risePx: 0,
    });
  }

  private tickVisuals(items: TimedVisual[], delta: number, rise: boolean): void {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      item.remainingMs -= delta;
      const t = Math.max(0, item.remainingMs / item.lifetimeMs);
      item.object.setAlpha(t);
      if (rise) {
        item.object.y = item.startY - item.risePx * (1 - t);
      }

      if (item.remainingMs <= 0) {
        item.object.destroy();
        items.splice(i, 1);
      }
    }
  }

  private destroy(): void {
    this.hitStopUntilMs = 0;
    if (this.scene.physics.world.isPaused) {
      this.scene.physics.world.resume();
    }

    this.clearVisuals(this.afterImages);
    this.clearVisuals(this.slashes);
    this.clearVisuals(this.numbers);
  }

  private clearVisuals(items: TimedVisual[]): void {
    for (const item of items) {
      item.object.destroy();
    }
    items.length = 0;
  }
}
