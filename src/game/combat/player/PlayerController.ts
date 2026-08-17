import * as Phaser from 'phaser';

type MoveKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

const MOVE_SPEED = 220;
const DASH_SPEED = 620;
const DASH_DURATION_MS = 160;
const DASH_COOLDOWN_MS = 550;
const INVINCIBLE_DURATION_MS = 120;
const DASH_ALPHA = 0.45;
const IDLE_ALPHA = 1;

export class PlayerController {
  private readonly keys: MoveKeys | null;
  private readonly spaceKey: Phaser.Input.Keyboard.Key | null;
  private readonly moveInput = new Phaser.Math.Vector2();
  private readonly lastDirection = new Phaser.Math.Vector2(1, 0);
  private readonly dashDirection = new Phaser.Math.Vector2(1, 0);

  private dashRemainingMs = 0;
  private cooldownRemainingMs = 0;
  private invincibleRemainingMs = 0;

  private _isDashing = false;
  private _isInvincible = false;

  constructor(
    scene: Phaser.Scene,
    private readonly body: Phaser.Physics.Arcade.Body,
    private readonly speed: number = MOVE_SPEED
  ) {
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

  get isInvincible(): boolean {
    return this._isInvincible;
  }

  update(delta: number): void {
    if (!this.keys) {
      this.body.setVelocity(0, 0);
      return;
    }

    this.readMoveInput();
    this.tickTimers(delta);
    this.tryStartDash();

    if (this._isDashing) {
      this.body.setVelocity(
        this.dashDirection.x * DASH_SPEED,
        this.dashDirection.y * DASH_SPEED
      );
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
  }

  private tryStartDash(): void {
    if (!this.spaceKey || this._isDashing || this.cooldownRemainingMs > 0) {
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

    this._isDashing = true;
    this._isInvincible = true;
    this.dashRemainingMs = DASH_DURATION_MS;
    this.invincibleRemainingMs = INVINCIBLE_DURATION_MS;
    this.cooldownRemainingMs = DASH_COOLDOWN_MS;
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
    const visual = this.body.gameObject as Phaser.GameObjects.GameObject & {
      setAlpha?: (value: number) => unknown;
    };

    visual.setAlpha?.(this._isDashing ? DASH_ALPHA : IDLE_ALPHA);
  }
}
