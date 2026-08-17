import * as Phaser from 'phaser';
import type { PlayerController } from './PlayerController';

const ATTACK_DURATION_MS = 180;
const ATTACK_COOLDOWN_MS = 320;
const HITBOX_ACTIVE_START_MS = 50;
const HITBOX_ACTIVE_END_MS = 120;
const HITBOX_WIDTH = 36;
const HITBOX_HEIGHT = 40;
const HITBOX_OFFSET = 28;
const HITBOX_COLOR = 0xf5ead0;
const HITBOX_ALPHA = 0.35;

export class PlayerAttackController {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly hitboxBody: Phaser.Physics.Arcade.Body;
  private readonly _attackDirection = new Phaser.Math.Vector2(1, 0);

  private attackRemainingMs = 0;
  private cooldownRemainingMs = 0;
  private _isAttacking = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.GameObjects.Rectangle,
    private readonly movement: PlayerController
  ) {
    this.hitbox = scene.add.rectangle(0, 0, HITBOX_WIDTH, HITBOX_HEIGHT, HITBOX_COLOR, HITBOX_ALPHA);
    this.hitbox.setVisible(false);
    this.hitbox.setDepth(1);

    scene.physics.add.existing(this.hitbox);
    this.hitboxBody = this.hitbox.body as Phaser.Physics.Arcade.Body;
    this.hitboxBody.setAllowGravity(false);
    this.hitboxBody.setImmovable(true);
    this.hitboxBody.setEnable(false);

    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get isAttacking(): boolean {
    return this._isAttacking;
  }

  get attackDirection(): Phaser.Math.Vector2 {
    return this._attackDirection;
  }

  get canAttack(): boolean {
    return !this._isAttacking && this.cooldownRemainingMs <= 0 && !this.movement.isDashing;
  }

  update(delta: number): void {
    this.tickTimers(delta);

    if (!this._isAttacking) {
      return;
    }

    this.syncHitboxTransform();
    this.syncHitboxActive();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.leftButtonDown()) {
      return;
    }

    this.tryStartAttack(pointer);
  }

  private tryStartAttack(pointer: Phaser.Input.Pointer): void {
    if (!this.canAttack) {
      return;
    }

    this.updateAttackDirectionFromPointer(pointer);
    this._isAttacking = true;
    this.attackRemainingMs = ATTACK_DURATION_MS;
    this.cooldownRemainingMs = ATTACK_COOLDOWN_MS;
    this.hitbox.setVisible(true);
    this.syncHitboxTransform();
    this.syncHitboxActive();
  }

  private updateAttackDirectionFromPointer(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.worldX - this.player.x;
    const dy = pointer.worldY - this.player.y;

    if (dx === 0 && dy === 0) {
      this._attackDirection.set(1, 0);
      return;
    }

    this._attackDirection.set(dx, dy).normalize();
  }

  private tickTimers(delta: number): void {
    if (this.attackRemainingMs > 0) {
      this.attackRemainingMs -= delta;
      if (this.attackRemainingMs <= 0) {
        this.attackRemainingMs = 0;
        this.endAttack();
      }
    }

    if (this.cooldownRemainingMs > 0) {
      this.cooldownRemainingMs -= delta;
      if (this.cooldownRemainingMs < 0) {
        this.cooldownRemainingMs = 0;
      }
    }
  }

  private endAttack(): void {
    this._isAttacking = false;
    this.hitbox.setVisible(false);
    this.hitboxBody.setEnable(false);
  }

  private syncHitboxTransform(): void {
    this.hitbox.setPosition(
      this.player.x + this._attackDirection.x * HITBOX_OFFSET,
      this.player.y + this._attackDirection.y * HITBOX_OFFSET
    );
    this.hitbox.setRotation(this._attackDirection.angle());
  }

  private syncHitboxActive(): void {
    const elapsed = ATTACK_DURATION_MS - this.attackRemainingMs;
    const isActive = elapsed >= HITBOX_ACTIVE_START_MS && elapsed < HITBOX_ACTIVE_END_MS;
    this.hitboxBody.setEnable(isActive);
  }

  private destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.hitboxBody.setEnable(false);
    this.hitbox.destroy();
  }
}
