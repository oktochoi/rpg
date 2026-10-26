import * as Phaser from 'phaser';
import type { BasicAttackProfile } from '../attacks/attack-types';
import type { PlayerController } from './PlayerController';
import { isCombatHitboxDebug } from '../visual/hitbox-debug';

const DEFAULT_HITBOX_COLOR = 0xf5ead0;
const HITBOX_ALPHA = 0.35;

export interface ProjectileSpawnRequest {
  originX: number;
  originY: number;
  pointerX: number;
  pointerY: number;
  damage: number;
  speed: number;
  lifetimeMs: number;
  radius: number;
  color: number;
  knockbackScale: number;
  skillId: string;
}

export class PlayerAttackController {
  private readonly hitbox: Phaser.GameObjects.Rectangle;
  private readonly hitboxBody: Phaser.Physics.Arcade.Body;
  private readonly _attackDirection = new Phaser.Math.Vector2(1, 0);
  private readonly profile: BasicAttackProfile;
  private readonly spawnProjectile?: (request: ProjectileSpawnRequest) => void;
  private _attackId = 0;

  private attackRemainingMs = 0;
  private cooldownRemainingMs = 0;
  private _isAttacking = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle,
    private readonly movement: PlayerController,
    options: {
      profile: BasicAttackProfile;
      spawnProjectile?: (request: ProjectileSpawnRequest) => void;
    }
  ) {
    this.profile = options.profile;
    this.spawnProjectile = options.spawnProjectile;
    this.hitbox = scene.add.rectangle(
      0,
      0,
      this.profile.hitbox.width,
      this.profile.hitbox.height,
      DEFAULT_HITBOX_COLOR,
      HITBOX_ALPHA
    );
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

  get kind(): BasicAttackProfile['type'] {
    return this.profile.type;
  }

  get isAttacking(): boolean {
    return this._isAttacking;
  }

  get isStrikePhase(): boolean {
    if (!this._isAttacking) {
      return false;
    }
    if (this.profile.type !== 'MELEE') {
      return true;
    }
    const elapsed = this.profile.durationMs - this.attackRemainingMs;
    return elapsed >= this.profile.hitbox.activeStartMs;
  }

  get attackDirection(): Phaser.Math.Vector2 {
    return this._attackDirection;
  }

  get attackId(): number {
    return this._attackId;
  }

  get hitboxObject(): Phaser.GameObjects.Rectangle {
    return this.hitbox;
  }

  get damage(): number {
    return this.profile.damage;
  }

  get knockbackScale(): number {
    return this.profile.knockbackScale;
  }

  get canAttack(): boolean {
    return (
      !this._isAttacking &&
      this.cooldownRemainingMs <= 0 &&
      !this.movement.isDashing &&
      !this.movement.isSkillMoving &&
      !this.movement.isDead &&
      !this.movement.isCombatLocked
    );
  }

  get blocksDash(): boolean {
    if (!this._isAttacking) {
      return false;
    }
    const elapsed = this.profile.durationMs - this.attackRemainingMs;
    return elapsed < this.profile.durationMs * 0.42;
  }

  cancel(): void {
    this.endAttack();
  }

  update(delta: number): void {
    this.tickTimers(delta);

    if (!this._isAttacking || this.profile.type !== 'MELEE') {
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
    this._attackId += 1;
    this._isAttacking = true;
    this.attackRemainingMs = this.profile.durationMs;
    this.cooldownRemainingMs = this.profile.cooldownMs;

    if (this.profile.type === 'PROJECTILE') {
      this.fireProjectile(pointer);
      return;
    }

    this.hitbox.setVisible(isCombatHitboxDebug());
    this.syncHitboxTransform();
    this.syncHitboxActive();
  }

  private fireProjectile(pointer: Phaser.Input.Pointer): void {
    const projectile = this.profile.projectile;
    if (!projectile || !this.spawnProjectile) {
      this.endAttack();
      return;
    }

    this.spawnProjectile({
      originX: this.player.x,
      originY: this.player.y,
      pointerX: pointer.worldX,
      pointerY: pointer.worldY,
      damage: this.profile.damage,
      speed: projectile.speed,
      lifetimeMs: projectile.lifetimeMs,
      radius: projectile.radius,
      color: projectile.color,
      knockbackScale: this.profile.knockbackScale,
      skillId: this.profile.id,
    });
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
      this.player.x + this._attackDirection.x * this.profile.hitbox.offset,
      this.player.y + this._attackDirection.y * this.profile.hitbox.offset
    );
    this.hitbox.setRotation(this._attackDirection.angle());
  }

  private syncHitboxActive(): void {
    const elapsed = this.profile.durationMs - this.attackRemainingMs;
    const isActive =
      elapsed >= this.profile.hitbox.activeStartMs && elapsed < this.profile.hitbox.activeEndMs;
    this.hitboxBody.setEnable(isActive);
  }

  private destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.hitboxBody.setEnable(false);
    this.hitbox.destroy();
  }
}
