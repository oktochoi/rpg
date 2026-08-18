import * as Phaser from 'phaser';
import { ENEMY_BEHAVIOR_TYPE, type EnemyDefinition, type EnemyTypeId } from './enemy-types';
import type { EnemyBehavior, EnemyBehaviorContext } from './behaviors/behavior-types';
import {
  ENEMY_ATTACK_ACTIVE_ALPHA,
  ENEMY_ATTACK_HITBOX_COLOR,
  ENEMY_ATTACK_WINDUP_ALPHA,
  ENEMY_DEATH_END_SCALE,
  ENEMY_DEATH_FADE_MS,
  ENEMY_HIT_COLOR,
  ENEMY_HIT_FLASH_MS,
  ENEMY_HP_BAR_BG,
  ENEMY_HP_BAR_FILL,
  ENEMY_HP_BAR_HEIGHT,
  ENEMY_HP_BAR_OFFSET_Y,
  ENEMY_KNOCKBACK_DURATION_MS,
  ENEMY_KNOCKBACK_SPEED,
  ENEMY_WINDUP_COLOR,
} from './EnemyConfig';
import type { EnemyRangedShot } from './enemy-runtime';
import { COMBAT_DEPTH } from '../visual/combat-depth';
import { getEnemyAsset } from '../visual/asset-registry';

export interface EnemyDamageHit {
  amount: number;
  direction: Phaser.Math.Vector2;
  attackId: number;
  knockbackScale?: number;
}

export interface EnemyControllerOptions {
  instanceId: string;
  typeId: EnemyTypeId;
  definition: EnemyDefinition;
  behavior: EnemyBehavior;
  onRangedShot?: (shot: EnemyRangedShot) => void;
}

export class EnemyController {
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly knockbackVelocity = new Phaser.Math.Vector2();
  private readonly _attackDirection = new Phaser.Math.Vector2(1, 0);
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;
  private readonly attackHitbox: Phaser.GameObjects.Rectangle;
  private readonly attackHitboxBody: Phaser.Physics.Arcade.Body;
  private readonly debugLabel: Phaser.GameObjects.Text;
  private readonly hpBarWidth: number;

  private readonly _id: string;
  private readonly _typeId: EnemyTypeId;
  private readonly definition: EnemyDefinition;
  private readonly behavior: EnemyBehavior;
  private readonly onRangedShot?: (shot: EnemyRangedShot) => void;
  private readonly _maxHp: number;
  private readonly _attackDamage: number;
  private _currentHp: number;
  private _isHit = false;
  private _isDead = false;
  private _isAttacking = false;
  private _isHalted = false;
  private _attackId = 0;
  private _formationIndex = 0;
  private _aliveCount = 1;
  private rangedShotFired = false;

  private hitFlashRemainingMs = 0;
  private knockbackRemainingMs = 0;
  private deathFadeRemainingMs = 0;
  private attackRemainingMs = 0;
  private attackCooldownRemainingMs = 0;
  private lastHitAttackId = -1;
  private slowRemainingMs = 0;
  private slowMultiplier = 1;

  constructor(
    scene: Phaser.Scene,
    private readonly enemy: Phaser.GameObjects.Rectangle,
    private readonly player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc,
    private readonly isPlayerAlive: () => boolean,
    options: EnemyControllerOptions
  ) {
    this._id = options.instanceId;
    this._typeId = options.typeId;
    this.definition = options.definition;
    this.behavior = options.behavior;
    this.onRangedShot = options.onRangedShot;
    this._maxHp = options.definition.maxHp;
    this._attackDamage = options.definition.damage;
    this._currentHp = this._maxHp;
    this.hpBarWidth = Math.max(36, options.definition.size);
    this.body = enemy.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0, 0);
    this.body.setDrag(0, 0);

    this.hpBarBg = scene.add.rectangle(0, 0, this.hpBarWidth, ENEMY_HP_BAR_HEIGHT, ENEMY_HP_BAR_BG);
    this.hpBarFill = scene.add.rectangle(0, 0, this.hpBarWidth, ENEMY_HP_BAR_HEIGHT, ENEMY_HP_BAR_FILL);
    this.hpBarBg.setDepth(COMBAT_DEPTH.hpBar);
    this.hpBarFill.setDepth(COMBAT_DEPTH.hpBar);
    this.hpBarFill.setOrigin(0, 0.5);

    const hitboxWidth = Math.max(8, options.definition.hitboxWidth);
    const hitboxHeight = Math.max(8, options.definition.hitboxHeight);
    this.attackHitbox = scene.add.rectangle(
      0,
      0,
      hitboxWidth,
      hitboxHeight,
      ENEMY_ATTACK_HITBOX_COLOR,
      ENEMY_ATTACK_WINDUP_ALPHA
    );
    this.attackHitbox.setVisible(false);
    this.attackHitbox.setDepth(1);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitboxBody = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    this.attackHitboxBody.setAllowGravity(false);
    this.attackHitboxBody.setImmovable(true);
    this.attackHitboxBody.setEnable(false);

    this.debugLabel = scene.add.text(0, 0, options.definition.name.toUpperCase(), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#ece6d9',
    });
    this.debugLabel.setOrigin(0.5, 1);
    this.debugLabel.setDepth(4);

    this.syncHpBar();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get gameObject(): Phaser.GameObjects.Rectangle {
    return this.enemy;
  }

  get attackHitboxObject(): Phaser.GameObjects.Rectangle {
    return this.attackHitbox;
  }

  get id(): string {
    return this._id;
  }

  get typeId(): EnemyTypeId {
    return this._typeId;
  }

  get size(): number {
    return this.definition.size;
  }

  get isHit(): boolean {
    return this._isHit;
  }

  get deathProgress(): number {
    if (!this._isDead) {
      return 0;
    }
    return 1 - Math.max(0, this.deathFadeRemainingMs / ENEMY_DEATH_FADE_MS);
  }

  get isDead(): boolean {
    return this._isDead;
  }

  get isAttacking(): boolean {
    return this._isAttacking;
  }

  get isStrikePhase(): boolean {
    if (!this._isAttacking) {
      return false;
    }
    const elapsed = this.definition.attackDurationMs - this.attackRemainingMs;
    if (this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.RANGED) {
      return elapsed >= this.definition.telegraphMs;
    }
    return elapsed >= this.definition.hitStartMs;
  }

  get attackDirection(): Phaser.Math.Vector2 {
    return this._attackDirection;
  }

  get attackId(): number {
    return this._attackId;
  }

  get attackDamage(): number {
    return this._attackDamage;
  }

  get maxHp(): number {
    return this._maxHp;
  }

  get currentHp(): number {
    return this._currentHp;
  }

  get moveSpeed(): number {
    return this.definition.moveSpeed * this.slowMultiplier;
  }

  get position(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.enemy.x, this.enemy.y);
  }

  get velocity(): Phaser.Math.Vector2 {
    return this.body.velocity;
  }

  setFormation(index: number, aliveCount: number): void {
    this._formationIndex = index;
    this._aliveCount = Math.max(1, aliveCount);
  }

  nudge(dx: number, dy: number, bounds: { width: number; height: number }): void {
    const half = this.definition.size / 2;
    this.enemy.x = Phaser.Math.Clamp(this.enemy.x + dx, half, bounds.width - half);
    this.enemy.y = Phaser.Math.Clamp(this.enemy.y + dy, half, bounds.height - half);
  }

  halt(): void {
    this._isHalted = true;
    this.slowRemainingMs = 0;
    this.slowMultiplier = 1;
    this.cancelAttack();
    this.body.setVelocity(0, 0);
  }

  applySlow(multiplier: number, durationMs: number): void {
    this.slowMultiplier = Math.max(0.05, Math.min(1, multiplier));
    this.slowRemainingMs = Math.max(this.slowRemainingMs, durationMs);
  }

  update(delta: number): void {
    if (this._isDead) {
      this.tickDeath(delta);
      return;
    }

    if (this._isHalted) {
      this.tickHitFlash(delta);
      this.body.setVelocity(0, 0);
      this.syncHpBar();
      return;
    }

    this.tickHitFlash(delta);
    this.tickSlow(delta);
    this.tickAttack(delta);
    this.tickKnockback(delta);
    this.syncHpBar();
  }

  takeDamage(hit: EnemyDamageHit): boolean {
    if (this._isDead || hit.amount <= 0 || this.lastHitAttackId === hit.attackId) {
      return false;
    }

    this.lastHitAttackId = hit.attackId;
    this._currentHp = Math.max(0, this._currentHp - hit.amount);
    this.playHitFeedback();
    this.cancelAttack();
    this.startKnockback(hit.direction, hit.knockbackScale ?? 1);
    this.syncHpBar();

    if (this._currentHp <= 0) {
      this.beginDeath();
    }

    return true;
  }

  playHitFeedback(): void {
    this._isHit = true;
    this.hitFlashRemainingMs = ENEMY_HIT_FLASH_MS;
    this.enemy.setFillStyle(ENEMY_HIT_COLOR);
  }

  private behaviorContext(): EnemyBehaviorContext {
    return {
      x: this.enemy.x,
      y: this.enemy.y,
      playerX: this.player.x,
      playerY: this.player.y,
      distance: this.distanceToPlayer(),
      isPlayerAlive: this.isPlayerAlive(),
      isAttacking: this._isAttacking,
      knockbackActive: this.knockbackRemainingMs > 0,
      moveSpeed: this.moveSpeed,
      definition: this.definition,
      formationIndex: this._formationIndex,
      aliveCount: this._aliveCount,
    };
  }

  private distanceToPlayer(): number {
    return Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
  }

  private facePlayer(): void {
    this._attackDirection.set(this.player.x - this.enemy.x, this.player.y - this.enemy.y);
    if (this._attackDirection.x === 0 && this._attackDirection.y === 0) {
      this._attackDirection.set(1, 0);
      return;
    }
    this._attackDirection.normalize();
  }

  private canStartAttack(): boolean {
    return (
      !this._isDead &&
      !this._isHalted &&
      !this._isAttacking &&
      this.knockbackRemainingMs <= 0 &&
      this.attackCooldownRemainingMs <= 0 &&
      this.behavior.shouldStartAttack(this.behaviorContext())
    );
  }

  private tryStartAttack(): void {
    if (!this.canStartAttack()) {
      return;
    }

    this.facePlayer();
    this._attackId += 1;
    this._isAttacking = true;
    this.rangedShotFired = false;
    this.attackRemainingMs = this.definition.attackDurationMs;
    this.attackCooldownRemainingMs = this.definition.attackCooldownMs;
    this.attackHitbox.setVisible(true);
    this.syncAttackHitbox();
  }

  private cancelAttack(): void {
    this._isAttacking = false;
    this.attackRemainingMs = 0;
    this.rangedShotFired = false;
    this.attackHitbox.setVisible(false);
    this.attackHitboxBody.setEnable(false);
    this.enemy.setScale(1);
    this.syncAttackTelegraph();
  }

  private tickAttack(delta: number): void {
    if (this.attackCooldownRemainingMs > 0) {
      this.attackCooldownRemainingMs -= delta;
      if (this.attackCooldownRemainingMs < 0) {
        this.attackCooldownRemainingMs = 0;
      }
    }

    if (!this._isAttacking) {
      return;
    }

    this.attackRemainingMs -= delta;
    this.syncAttackHitbox();
    this.syncAttackTelegraph();
    this.tryFireRangedShot();

    if (this.attackRemainingMs <= 0) {
      this.cancelAttack();
    }
  }

  private tryFireRangedShot(): void {
    if (this.definition.behaviorType !== ENEMY_BEHAVIOR_TYPE.RANGED || this.rangedShotFired) {
      return;
    }
    const elapsed = this.definition.attackDurationMs - this.attackRemainingMs;
    if (elapsed < this.definition.telegraphMs) {
      return;
    }
    this.rangedShotFired = true;
    this.onRangedShot?.({
      instanceId: this._id,
      originX: this.enemy.x + this._attackDirection.x * 18,
      originY: this.enemy.y + this._attackDirection.y * 18,
      dirX: this._attackDirection.x,
      dirY: this._attackDirection.y,
      definition: this.definition,
    });
  }

  private syncAttackHitbox(): void {
    const offset =
      this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.RANGED ? 22 : this.definition.hitboxOffset;
    this.attackHitbox.setPosition(
      this.enemy.x + this._attackDirection.x * offset,
      this.enemy.y + this._attackDirection.y * offset
    );
    this.attackHitbox.setRotation(this._attackDirection.angle());

    const elapsed = this.definition.attackDurationMs - this.attackRemainingMs;
    const isActive =
      this.definition.behaviorType !== ENEMY_BEHAVIOR_TYPE.RANGED &&
      elapsed >= this.definition.hitStartMs &&
      elapsed < this.definition.hitEndMs;
    const windupAlpha =
      this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE ? 0.32 : ENEMY_ATTACK_WINDUP_ALPHA;
    this.attackHitbox.setAlpha(isActive ? ENEMY_ATTACK_ACTIVE_ALPHA : windupAlpha);
    this.attackHitboxBody.setEnable(isActive);
  }

  private telegraphColor(): number {
    if (this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE) {
      return 0xf0c040;
    }
    if (this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.RANGED) {
      return 0xffd080;
    }
    return ENEMY_WINDUP_COLOR;
  }

  private syncAttackTelegraph(): void {
    if (this._isDead || this.hitFlashRemainingMs > 0) {
      return;
    }

    if (!this._isAttacking) {
      this.enemy.setFillStyle(this.definition.color);
      this.enemy.setScale(1);
      return;
    }

    const elapsed = this.definition.attackDurationMs - this.attackRemainingMs;
    const isWindup = elapsed < this.definition.hitStartMs;
    this.enemy.setFillStyle(isWindup ? this.telegraphColor() : this.definition.color);
    if (this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE && isWindup) {
      this.enemy.setScale(1.12);
    } else {
      this.enemy.setScale(1);
    }
  }

  private startKnockback(direction: Phaser.Math.Vector2, scale = 1): void {
    if (direction.x === 0 && direction.y === 0) {
      this.knockbackVelocity.set(0, 0);
      this.knockbackRemainingMs = 0;
      return;
    }

    this.knockbackVelocity.copy(direction).normalize().scale(ENEMY_KNOCKBACK_SPEED * scale);
    this.knockbackRemainingMs = ENEMY_KNOCKBACK_DURATION_MS;
  }

  private tickKnockback(delta: number): void {
    if (this.knockbackRemainingMs > 0) {
      this.knockbackRemainingMs -= delta;
      this.body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
      if (this.knockbackRemainingMs <= 0) {
        this.knockbackRemainingMs = 0;
        this.knockbackVelocity.set(0, 0);
      }
      return;
    }

    this.updateMoveOrAttack();
  }

  private updateMoveOrAttack(): void {
    const ctx = this.behaviorContext();
    if (this._isAttacking) {
      this.body.setVelocity(0, 0);
      return;
    }

    const move = this.behavior.chooseMove(ctx);
    this.body.setVelocity(move.vx, move.vy);
    this.facePlayer();
    this.tryStartAttack();
  }

  private tickHitFlash(delta: number): void {
    if (this.hitFlashRemainingMs <= 0) {
      return;
    }

    this.hitFlashRemainingMs -= delta;
    if (this.hitFlashRemainingMs <= 0) {
      this.hitFlashRemainingMs = 0;
      this._isHit = false;
      if (!this._isDead) {
        this.enemy.setFillStyle(this.definition.color);
      }
    }
  }

  private tickSlow(delta: number): void {
    if (this.slowRemainingMs <= 0) {
      this.slowMultiplier = 1;
      return;
    }
    this.slowRemainingMs -= delta;
    if (this.slowRemainingMs <= 0) {
      this.slowRemainingMs = 0;
      this.slowMultiplier = 1;
    }
  }

  private beginDeath(): void {
    this._isDead = true;
    this._isHit = false;
    this.cancelAttack();
    this.knockbackRemainingMs = 0;
    this.knockbackVelocity.set(0, 0);
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    this.deathFadeRemainingMs = ENEMY_DEATH_FADE_MS;
  }

  private tickDeath(delta: number): void {
    if (this.deathFadeRemainingMs <= 0) {
      return;
    }

    this.deathFadeRemainingMs -= delta;
    const t = 1 - Math.max(0, this.deathFadeRemainingMs / ENEMY_DEATH_FADE_MS);
    const fade = 1 - t;
    this.enemy.setAlpha(fade);
    this.enemy.setScale(1 - t * (1 - ENEMY_DEATH_END_SCALE));
    this.hpBarBg.setAlpha(fade);
    this.hpBarFill.setAlpha(fade);
    this.debugLabel.setAlpha(fade);

    if (this.deathFadeRemainingMs <= 0) {
      this.deathFadeRemainingMs = 0;
      this.enemy.setVisible(false);
      this.hpBarBg.setVisible(false);
      this.hpBarFill.setVisible(false);
      this.debugLabel.setVisible(false);
    }
  }

  private syncHpBar(): void {
    const offsetY = getEnemyAsset(this._typeId).hpBarOffsetY ?? this.definition.size / 2 + ENEMY_HP_BAR_OFFSET_Y;
    const barY = this.enemy.y - offsetY;
    this.hpBarBg.setPosition(this.enemy.x, barY);
    this.hpBarFill.setPosition(this.enemy.x - this.hpBarWidth / 2, barY);
    this.hpBarFill.displayWidth = this.hpBarWidth * (this._currentHp / this._maxHp);
    this.debugLabel.setPosition(this.enemy.x, barY - 8);
  }

  private destroy(): void {
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    this.attackHitboxBody.setEnable(false);
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.attackHitbox.destroy();
    this.debugLabel.destroy();
  }
}
