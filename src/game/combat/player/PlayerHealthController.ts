import * as Phaser from 'phaser';
import {
  PLAYER_COLOR,
  PLAYER_DEATH_ALPHA,
  PLAYER_DEATH_COLOR,
  PLAYER_DEATH_FADE_MS,
  PLAYER_HIT_COLOR,
  PLAYER_HIT_FLASH_MS,
  PLAYER_HIT_INVINCIBLE_MS,
  PLAYER_HP_BAR_BG,
  PLAYER_HP_BAR_FILL,
  PLAYER_HP_BAR_HEIGHT,
  PLAYER_HP_BAR_OFFSET_Y,
  PLAYER_HP_BAR_WIDTH,
  PLAYER_MAX_HP,
  PLAYER_SIZE,
} from '../CombatConfig';
import type { PlayerController } from './PlayerController';
import { applyDamageReduction } from '../skills/skill-combat-rules';

export interface PlayerDamageHit {
  amount: number;
  attackId: number;
  direction: Phaser.Math.Vector2;
}

export class PlayerHealthController {
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;

  private readonly _maxHp: number;
  private readonly _maxMp: number;
  private _currentHp: number;
  private _currentMp: number;
  private _isDead = false;
  private hitFlashRemainingMs = 0;
  private deathFadeRemainingMs = 0;
  private lastHitAttackId = -1;
  private guardRemainingMs = 0;
  private guardReduction = 0;
  private readonly bodyColor: number;
  private readonly bodySize: number;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc,
    private readonly movement: PlayerController,
    health?: { maxHp: number; currentHp: number; maxMp?: number; currentMp?: number; bodyColor?: number; size?: number }
  ) {
    this._maxHp = health?.maxHp ?? PLAYER_MAX_HP;
    this._currentHp = Math.max(0, Math.min(this._maxHp, health?.currentHp ?? this._maxHp));
    this._maxMp = Math.max(0, health?.maxMp ?? 0);
    this._currentMp = Math.max(0, Math.min(this._maxMp, health?.currentMp ?? this._maxMp));
    this.bodyColor = health?.bodyColor ?? PLAYER_COLOR;
    this.bodySize = health?.size ?? PLAYER_SIZE;
    this.body = player.body as Phaser.Physics.Arcade.Body;
    this.hpBarBg = scene.add.rectangle(0, 0, PLAYER_HP_BAR_WIDTH, PLAYER_HP_BAR_HEIGHT, PLAYER_HP_BAR_BG);
    this.hpBarFill = scene.add.rectangle(0, 0, PLAYER_HP_BAR_WIDTH, PLAYER_HP_BAR_HEIGHT, PLAYER_HP_BAR_FILL);
    this.hpBarBg.setDepth(2);
    this.hpBarFill.setDepth(3);
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
    this.syncHpBar();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get isDead(): boolean {
    return this._isDead;
  }

  get isInvincible(): boolean {
    return this.movement.isInvincible;
  }

  get maxHp(): number {
    return this._maxHp;
  }

  get currentHp(): number {
    return this._currentHp;
  }

  get maxMp(): number {
    return this._maxMp;
  }

  get currentMp(): number {
    return this._currentMp;
  }

  get isHitFlashing(): boolean {
    return this.hitFlashRemainingMs > 0;
  }

  get deathProgress(): number {
    if (!this._isDead) {
      return 0;
    }
    return 1 - Math.max(0, this.deathFadeRemainingMs / PLAYER_DEATH_FADE_MS);
  }

  consumeMp(amount: number): boolean {
    if (amount <= 0) {
      return true;
    }
    if (this._currentMp < amount) {
      return false;
    }
    this._currentMp -= amount;
    return true;
  }

  get isGuarding(): boolean {
    return this.guardRemainingMs > 0;
  }

  startGuard(durationMs: number, reduction: number): void {
    this.guardRemainingMs = Math.max(this.guardRemainingMs, durationMs);
    this.guardReduction = reduction;
  }

  update(delta: number): void {
    if (this._isDead) {
      this.tickDeath(delta);
      return;
    }

    this.tickHitFlash(delta);
    this.tickGuard(delta);
    this.syncHpBar();
  }

  takeDamage(hit: PlayerDamageHit): boolean {
    if (
      this._isDead ||
      this.movement.isInvincible ||
      hit.amount <= 0 ||
      this.lastHitAttackId === hit.attackId
    ) {
      return false;
    }

    this.lastHitAttackId = hit.attackId;
    const amount = this.guardRemainingMs > 0 ? applyDamageReduction(hit.amount, this.guardReduction) : hit.amount;
    this._currentHp = Math.max(0, this._currentHp - amount);
    this.playHitFeedback();
    this.movement.grantInvincible(PLAYER_HIT_INVINCIBLE_MS);
    this.movement.applyKnockback(hit.direction);
    this.syncHpBar();

    if (this._currentHp <= 0) {
      this.beginDeath();
    }

    return true;
  }

  playHitFeedback(): void {
    this.hitFlashRemainingMs = PLAYER_HIT_FLASH_MS;
    this.player.setFillStyle(PLAYER_HIT_COLOR);
  }

  private tickHitFlash(delta: number): void {
    if (this.hitFlashRemainingMs <= 0) {
      return;
    }

    this.hitFlashRemainingMs -= delta;
    if (this.hitFlashRemainingMs <= 0) {
      this.hitFlashRemainingMs = 0;
      if (!this._isDead) {
        this.player.setFillStyle(this.bodyColor);
      }
    }
  }

  private tickGuard(delta: number): void {
    if (this.guardRemainingMs <= 0) {
      return;
    }
    this.guardRemainingMs -= delta;
    if (this.guardRemainingMs < 0) {
      this.guardRemainingMs = 0;
      this.guardReduction = 0;
    }
  }

  private beginDeath(): void {
    this._isDead = true;
    this.movement.markDead();
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    this.player.setFillStyle(PLAYER_DEATH_COLOR);
    this.deathFadeRemainingMs = PLAYER_DEATH_FADE_MS;
  }

  private tickDeath(delta: number): void {
    if (this.deathFadeRemainingMs <= 0) {
      return;
    }

    this.deathFadeRemainingMs -= delta;
    const t = 1 - Math.max(0, this.deathFadeRemainingMs / PLAYER_DEATH_FADE_MS);
    const alpha = 1 - t * (1 - PLAYER_DEATH_ALPHA);
    this.player.setAlpha(alpha);
    this.hpBarBg.setAlpha(alpha);
    this.hpBarFill.setAlpha(alpha);

    if (this.deathFadeRemainingMs <= 0) {
      this.deathFadeRemainingMs = 0;
    }
  }

  private syncHpBar(): void {
    const barY = this.player.y - this.bodySize / 2 - PLAYER_HP_BAR_OFFSET_Y;
    this.hpBarBg.setPosition(this.player.x, barY);
    this.hpBarFill.setPosition(this.player.x - PLAYER_HP_BAR_WIDTH / 2, barY);
    this.hpBarFill.displayWidth = PLAYER_HP_BAR_WIDTH * (this._currentHp / this._maxHp);
  }

  private destroy(): void {
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
  }
}
