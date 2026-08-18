import * as Phaser from 'phaser';
import type { DashProfile } from '../../player/classes/class-types';
import { PLAYER_KNOCKBACK_DURATION_MS, PLAYER_KNOCKBACK_SPEED } from '../CombatConfig';

type MoveKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

const MOVE_SPEED = 220;
const DEFAULT_DASH: DashProfile = {
  id: 'default_dash',
  speed: 620,
  durationMs: 160,
  cooldownMs: 550,
  invincibleMs: 120,
  style: 'dash',
};
const DASH_ALPHA = 0.45;
const IDLE_ALPHA = 1;

export interface PlayerMovementOptions {
  moveSpeed?: number;
  dash?: DashProfile;
}

export class PlayerController {
  private readonly keys: MoveKeys | null;
  private readonly spaceKey: Phaser.Input.Keyboard.Key | null;
  private readonly moveInput = new Phaser.Math.Vector2();
  private readonly lastDirection = new Phaser.Math.Vector2(1, 0);
  private readonly dashDirection = new Phaser.Math.Vector2(1, 0);
  private readonly speed: number;
  private readonly dash: DashProfile;

  private readonly knockbackVelocity = new Phaser.Math.Vector2();
  private dashRemainingMs = 0;
  private cooldownRemainingMs = 0;
  private invincibleRemainingMs = 0;
  private knockbackRemainingMs = 0;

  private _isDashing = false;
  private _isInvincible = false;
  private _isDead = false;
  private _combatLocked = false;
  private skillMoveRemainingMs = 0;
  private readonly skillMoveDirection = new Phaser.Math.Vector2(1, 0);
  private skillMoveSpeed = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly body: Phaser.Physics.Arcade.Body,
    options?: PlayerMovementOptions
  ) {
    this.speed = options?.moveSpeed ?? MOVE_SPEED;
    this.dash = options?.dash ?? DEFAULT_DASH;
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      this.keys = null;
      this.spaceKey = null;
      return;
    }

    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);

    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MoveKeys;

    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  get isDashing(): boolean {
    return this._isDashing;
  }

  get isSkillMoving(): boolean {
    return this.skillMoveRemainingMs > 0;
  }

  get isEvasive(): boolean {
    return this._isDashing || this.skillMoveRemainingMs > 0;
  }

  get dashStyle(): DashProfile['style'] {
    return this.dash.style;
  }

  get facing(): Phaser.Math.Vector2 {
    return this.lastDirection.clone();
  }

  get dashCooldownRemainingMs(): number {
    return this.cooldownRemainingMs;
  }

  get dashCooldownMs(): number {
    return this.dash.cooldownMs;
  }

  get isMoving(): boolean {
    return this.body.velocity.lengthSq() > 4;
  }

  get isInvincible(): boolean {
    return this._isInvincible;
  }

  get isDead(): boolean {
    return this._isDead;
  }

  get isCombatLocked(): boolean {
    return this._combatLocked;
  }

  lockCombat(): void {
    this._combatLocked = true;
    this._isDashing = false;
    this.skillMoveRemainingMs = 0;
    this.knockbackRemainingMs = 0;
    this.knockbackVelocity.set(0, 0);
    this.body.setVelocity(0, 0);
    this.syncVisual();
  }

  applyKnockback(direction: Phaser.Math.Vector2): void {
    if (this._isDead || this._isDashing || this.skillMoveRemainingMs > 0 || this._combatLocked) {
      return;
    }

    if (direction.x === 0 && direction.y === 0) {
      return;
    }

    this.knockbackVelocity.copy(direction).normalize().scale(PLAYER_KNOCKBACK_SPEED);
    this.knockbackRemainingMs = PLAYER_KNOCKBACK_DURATION_MS;
  }

  grantInvincible(durationMs: number): void {
    this.invincibleRemainingMs = Math.max(this.invincibleRemainingMs, durationMs);
    this._isInvincible = this.invincibleRemainingMs > 0;
  }

  startForcedMove(direction: Phaser.Math.Vector2, speed: number, durationMs: number, invincibleMs = 0): void {
    if (this._isDead || this._combatLocked) {
      return;
    }
    if (direction.x === 0 && direction.y === 0) {
      this.skillMoveDirection.copy(this.lastDirection);
    } else {
      this.skillMoveDirection.copy(direction).normalize();
    }
    this.lastDirection.copy(this.skillMoveDirection);
    this._isDashing = false;
    this.dashRemainingMs = 0;
    this.knockbackRemainingMs = 0;
    this.knockbackVelocity.set(0, 0);
    this.skillMoveSpeed = speed;
    this.skillMoveRemainingMs = durationMs;
    if (invincibleMs > 0) {
      this.grantInvincible(invincibleMs);
    }
  }

  markDead(): void {
    this._isDead = true;
    this._isDashing = false;
    this.skillMoveRemainingMs = 0;
    this.knockbackRemainingMs = 0;
    this.knockbackVelocity.set(0, 0);
    this.body.setVelocity(0, 0);
  }

  update(delta: number): void {
    if (this._isDead || this._combatLocked || !this.keys) {
      this.body.setVelocity(0, 0);
      return;
    }

    this.readMoveInput();
    this.tickTimers(delta);
    this.tryStartDash();

    if (this.skillMoveRemainingMs > 0) {
      this.body.setVelocity(
        this.skillMoveDirection.x * this.skillMoveSpeed,
        this.skillMoveDirection.y * this.skillMoveSpeed
      );
      this.syncVisual();
      return;
    }

    if (this._isDashing) {
      if (this.dash.style === 'blink') {
        this.body.setVelocity(0, 0);
        this.syncVisual();
        return;
      }
      this.body.setVelocity(
        this.dashDirection.x * this.dash.speed,
        this.dashDirection.y * this.dash.speed
      );
      this.syncVisual();
      return;
    }

    if (this.knockbackRemainingMs > 0) {
      this.body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
      this.syncVisual();
      return;
    }

    this.applyWalkMovement();
    this.syncVisual();
  }

  private readMoveInput(): void {
    if (!this.keys) {
      this.moveInput.set(0, 0);
      return;
    }

    this.moveInput.set(
      Number(this.keys.right.isDown) - Number(this.keys.left.isDown),
      Number(this.keys.down.isDown) - Number(this.keys.up.isDown)
    );

    if (this.moveInput.x !== 0 || this.moveInput.y !== 0) {
      this.lastDirection.copy(this.moveInput).normalize();
    }
  }

  private tickTimers(delta: number): void {
    if (this.dashRemainingMs > 0) {
      this.dashRemainingMs -= delta;
      if (this.dashRemainingMs <= 0) {
        this.dashRemainingMs = 0;
        this._isDashing = false;
      }
    }

    if (this.skillMoveRemainingMs > 0) {
      this.skillMoveRemainingMs -= delta;
      if (this.skillMoveRemainingMs < 0) {
        this.skillMoveRemainingMs = 0;
      }
    }

    if (this.invincibleRemainingMs > 0) {
      this.invincibleRemainingMs -= delta;
      if (this.invincibleRemainingMs <= 0) {
        this.invincibleRemainingMs = 0;
        this._isInvincible = false;
      }
    }

    if (this.cooldownRemainingMs > 0) {
      this.cooldownRemainingMs -= delta;
      if (this.cooldownRemainingMs < 0) {
        this.cooldownRemainingMs = 0;
      }
    }

    if (this.knockbackRemainingMs > 0) {
      this.knockbackRemainingMs -= delta;
      if (this.knockbackRemainingMs < 0) {
        this.knockbackRemainingMs = 0;
        this.knockbackVelocity.set(0, 0);
      }
    }
  }

  private tryStartDash(): void {
    if (!this.spaceKey || this._isDead || this._combatLocked || this._isDashing || this.skillMoveRemainingMs > 0 || this.cooldownRemainingMs > 0) {
      return;
    }

    if (!Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      return;
    }

    if (this.moveInput.x !== 0 || this.moveInput.y !== 0) {
      this.dashDirection.copy(this.moveInput).normalize();
    } else {
      this.dashDirection.copy(this.lastDirection);
    }

    this.knockbackRemainingMs = 0;
    this.knockbackVelocity.set(0, 0);
    this.cooldownRemainingMs = this.dash.cooldownMs;
    this.grantInvincible(this.dash.invincibleMs);

    if (this.dash.style === 'blink') {
      this.applyBlink();
      return;
    }

    this._isDashing = true;
    this.dashRemainingMs = this.dash.durationMs;
  }

  private applyBlink(): void {
    const distance = this.dash.speed * (this.dash.durationMs / 1000);
    const half = this.body.halfWidth;
    const bounds = this.body.world.bounds;
    const nextX = Phaser.Math.Clamp(
      this.body.center.x + this.dashDirection.x * distance,
      bounds.x + half,
      bounds.right - half
    );
    const nextY = Phaser.Math.Clamp(
      this.body.center.y + this.dashDirection.y * distance,
      bounds.y + half,
      bounds.bottom - half
    );
    this.body.reset(nextX, nextY);
    this._isDashing = true;
    this.dashRemainingMs = this.dash.durationMs;
    this.body.setVelocity(0, 0);
  }

  private applyWalkMovement(): void {
    if (this.moveInput.x === 0 && this.moveInput.y === 0) {
      this.body.setVelocity(0, 0);
      return;
    }

    this.body.setVelocity(this.moveInput.x, this.moveInput.y);
    this.body.velocity.normalize().scale(this.speed);
  }

  private syncVisual(): void {
    if (this._isDead) {
      return;
    }
    const visual = this.body.gameObject as Phaser.GameObjects.GameObject & {
      setAlpha?: (value: number) => unknown;
    };

    visual.setAlpha?.(this._isDashing || this.skillMoveRemainingMs > 0 ? DASH_ALPHA : IDLE_ALPHA);
  }
}
