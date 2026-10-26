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
  ENEMY_KNOCKBACK_DURATION_MS,
  ENEMY_KNOCKBACK_SPEED,
  ENEMY_WINDUP_COLOR,
} from './EnemyConfig';
import type { EnemyRangedShot } from './enemy-runtime';
import { COMBAT_DEPTH } from '../visual/combat-depth';
import { getEnemyAsset } from '../visual/asset-registry';
import { isNavDebugEnabled } from '../../debug/debug-flags';
import { HEAVY_REPATH_MS, NAV_REPATH_MS, type NavSteer, type NavigationBoard } from '../navigation/navigation-board';

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
  canGrantMeleeToken?: (id: string) => boolean;
  tryAcquireMeleeToken?: (id: string) => boolean;
  releaseMeleeToken?: (id: string) => void;
  getPlayerVelocity?: () => { x: number; y: number };
  hitsObstacle?: (x: number, y: number, radius: number) => boolean;
  navigation?: NavigationBoard;
}

export type EnemyAiState =
  | 'IDLE'
  | 'PATROL'
  | 'CHASE'
  | 'PATH_CHASE'
  | 'REPOSITION'
  | 'ATTACK'
  | 'RECOVER'
  | 'RETURN'
  | 'DEAD';

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
  private readonly canGrantMeleeToken?: (id: string) => boolean;
  private readonly tryAcquireMeleeToken?: (id: string) => boolean;
  private readonly releaseMeleeToken?: (id: string) => void;
  private readonly getPlayerVelocity?: () => { x: number; y: number };
  private readonly hitsObstacle?: (x: number, y: number, radius: number) => boolean;
  private readonly navigation?: NavigationBoard;
  private recoverRemainingMs = 0;
  private aiState: EnemyAiState = 'IDLE';
  private lastNav: NavSteer | null = null;
  private readonly _maxHp: number;
  private readonly _attackDamage: number;
  private homeX: number;
  private homeY: number;
  private _currentHp: number;
  private _isHit = false;
  private _isDead = false;
  private _isAttacking = false;
  private _isHalted = false;
  private overheadHidden = false;
  private _attackId = 0;
  private _formationIndex = 0;
  private _aliveCount = 1;
  private rangedShotFired = false;
  private attackMove: 'melee' | 'lunge' | 'charge' = 'melee';
  private chargeLocked = new Phaser.Math.Vector2(1, 0);

  private hitFlashRemainingMs = 0;
  private knockbackRemainingMs = 0;
  private deathFadeRemainingMs = 0;
  private attackRemainingMs = 0;
  private attackCooldownRemainingMs = 0;
  private lastHitAttackId = -1;
  private slowRemainingMs = 0;
  private slowMultiplier = 1;
  private attackStaggerApplied = false;

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
    this.canGrantMeleeToken = options.canGrantMeleeToken;
    this.tryAcquireMeleeToken = options.tryAcquireMeleeToken;
    this.releaseMeleeToken = options.releaseMeleeToken;
    this.getPlayerVelocity = options.getPlayerVelocity;
    this.hitsObstacle = options.hitsObstacle;
    this.navigation = options.navigation;
    this._maxHp = options.definition.maxHp;
    this._attackDamage = options.definition.damage;
    this._currentHp = this._maxHp;
    this.homeX = enemy.x;
    this.homeY = enemy.y;
    this.hpBarWidth = Math.max(36, options.definition.size);
    this.body = enemy.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0, 0);
    this.body.setDrag(0, 0);

    this.hpBarBg = scene.add.rectangle(0, 0, this.hpBarWidth, ENEMY_HP_BAR_HEIGHT, ENEMY_HP_BAR_BG);
    this.hpBarFill = scene.add.rectangle(0, 0, this.hpBarWidth, ENEMY_HP_BAR_HEIGHT, ENEMY_HP_BAR_FILL);
    this.hpBarBg.setDepth(COMBAT_DEPTH.hpBar);
    this.hpBarFill.setDepth(COMBAT_DEPTH.hpBar + 0.01);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);

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
    this.debugLabel.setVisible(isNavDebugEnabled());

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

  get navigationState(): EnemyAiState {
    return this.aiState;
  }

  get navigationView(): NavSteer | null {
    return this.lastNav;
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

  applySeparation(vx: number, vy: number, cap: number): void {
    if (this._isDead || this._isHalted || this._isAttacking || this.recoverRemainingMs > 0) {
      return;
    }
    if (Math.hypot(this.body.velocity.x, this.body.velocity.y) < 8) {
      return;
    }
    const mag = Math.hypot(vx, vy);
    if (mag < 0.01) {
      return;
    }
    const scale = Math.min(1, cap / mag);
    const sx = vx * scale;
    const sy = vy * scale;
    const radius = this.definition.size / 2;
    const nextX = this.enemy.x + (this.body.velocity.x + sx) * 0.05;
    const nextY = this.enemy.y + (this.body.velocity.y + sy) * 0.05;
    if (this.hitsObstacle?.(nextX, nextY, radius)) {
      return;
    }
    this.body.setVelocity(this.body.velocity.x + sx, this.body.velocity.y + sy);
  }

  nudge(dx: number, dy: number, _bounds?: { width: number; height: number }): void {
    const half = this.definition.size / 2;
    const bounds = this.body.world.bounds;
    this.enemy.x = Phaser.Math.Clamp(this.enemy.x + dx, bounds.x + half, bounds.right - half);
    this.enemy.y = Phaser.Math.Clamp(this.enemy.y + dy, bounds.y + half, bounds.bottom - half);
  }

  hideOverhead(): void {
    this.overheadHidden = true;
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
  }

  halt(): void {
    this._isHalted = true;
    this.slowRemainingMs = 0;
    this.slowMultiplier = 1;
    this.cancelAttack();
    this.releaseMeleeToken?.(this._id);
    this.body.setVelocity(0, 0);
  }

  /** Walkable spawn the AI returns to. Entrance tweens must not leave home off the floor. */
  adoptHome(x: number, y: number): void {
    this.homeX = x;
    this.homeY = y;
  }

  /** Clears halt so AI can resume after encounter intro. */
  resume(): void {
    if (this._isDead) {
      return;
    }
    this._isHalted = false;
  }

  /** Holds the first swing so a pack does not attack on the same frame. */
  armFirstAttack(delayMs: number): void {
    if (this._isDead || delayMs <= 0) {
      return;
    }
    this.attackCooldownRemainingMs = Math.max(this.attackCooldownRemainingMs, delayMs);
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

    if (!this._isHalted) {
      this.containToWorld();
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
    const committed =
      this._isAttacking &&
      this.definition.attackDurationMs - this.attackRemainingMs >= this.definition.hitStartMs;
    if (!this.definition.stunLockImmune && !committed) {
      this.cancelAttack();
    }
    const resist = this.definition.knockbackResist ?? (this.definition.stunLockImmune ? 0.4 : 0);
    this.startKnockback(hit.direction, (hit.knockbackScale ?? 1) * (1 - resist));
    this.syncHpBar();

    if (this._currentHp <= 0) {
      if (this.definition.respawnOnDeath) {
        this._currentHp = this._maxHp;
        this.syncHpBar();
      } else {
        this.beginDeath();
      }
    }

    return true;
  }

  playHitFeedback(): void {
    this._isHit = true;
    this.hitFlashRemainingMs = ENEMY_HIT_FLASH_MS;
    this.enemy.setFillStyle(ENEMY_HIT_COLOR);
  }

  private behaviorContext(): EnemyBehaviorContext {
    const velocity = this.getPlayerVelocity?.() ?? { x: 0, y: 0 };
    const melee = this.definition.behaviorType !== ENEMY_BEHAVIOR_TYPE.RANGED;
    return {
      x: this.enemy.x,
      y: this.enemy.y,
      playerX: this.player.x,
      playerY: this.player.y,
      playerVx: velocity.x,
      playerVy: velocity.y,
      homeX: this.homeX,
      homeY: this.homeY,
      distance: this.distanceToPlayer(),
      isPlayerAlive: this.isPlayerAlive(),
      isAttacking: this._isAttacking,
      knockbackActive: this.knockbackRemainingMs > 0,
      moveSpeed: this.moveSpeed,
      definition: this.definition,
      formationIndex: this._formationIndex,
      aliveCount: this._aliveCount,
      hasMeleeToken: melee ? this.canGrantMeleeToken?.(this._id) !== false : true,
      pathClear: this.isPathClearToPlayer(),
    };
  }

  private isPathClearToPlayer(): boolean {
    if (this.navigation) {
      return this.navigation.hasSight(
        { x: this.enemy.x, y: this.enemy.y },
        { x: this.player.x, y: this.player.y }
      );
    }
    if (!this.hitsObstacle) {
      return true;
    }
    const dx = this.player.x - this.enemy.x;
    const dy = this.player.y - this.enemy.y;
    const radius = this.definition.size / 2;
    for (let step = 1; step <= 8; step += 1) {
      const t = step / 8;
      if (this.hitsObstacle(this.enemy.x + dx * t, this.enemy.y + dy * t, radius)) {
        return false;
      }
    }
    return true;
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
    if (!this.attackStaggerApplied) {
      this.attackStaggerApplied = true;
      const delay = (this._formationIndex % 4) * 110;
      if (delay > 0) {
        this.attackCooldownRemainingMs = delay;
        return;
      }
    }
    const melee = this.definition.behaviorType !== ENEMY_BEHAVIOR_TYPE.RANGED;
    if (melee && this.tryAcquireMeleeToken && !this.tryAcquireMeleeToken(this._id)) {
      return;
    }

    this.facePlayer();
    if (
      this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE ||
      this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.MELEE
    ) {
      const velocity = this.getPlayerVelocity?.() ?? { x: 0, y: 0 };
      const lead = this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE ? 0.28 : 0.18;
      this._attackDirection.set(
        this.player.x + velocity.x * lead - this.enemy.x,
        this.player.y + velocity.y * lead - this.enemy.y
      );
      if (this._attackDirection.lengthSq() > 0) {
        this._attackDirection.normalize();
      }
    }
    this._attackId += 1;
    this._isAttacking = true;
    this.rangedShotFired = false;
    this.attackRemainingMs = this.definition.attackDurationMs;
    this.attackCooldownRemainingMs = this.definition.attackCooldownMs;
    this.attackMove = this.resolveAttackMove();
    if (this.attackMove === 'charge') {
      this.chargeLocked.copy(this._attackDirection);
      this.attackRemainingMs =
        (this.definition.chargeWindupMs ?? 480) +
        (this.definition.chargeDurationMs ?? 380) +
        (this.definition.chargeRecoveryMs ?? 640);
    }
    this.attackHitbox.setVisible(true);
    this.syncAttackHitbox();
  }

  private cancelAttack(): void {
    this._isAttacking = false;
    this.attackRemainingMs = 0;
    this.rangedShotFired = false;
    this.attackMove = 'melee';
    this.releaseMeleeToken?.(this._id);
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
      const kind = this.definition.behaviorType;
      this.recoverRemainingMs =
        kind === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE ? 380 : kind === ENEMY_BEHAVIOR_TYPE.RANGED ? 140 : 220;
      this.cancelAttack();
    }
  }

  private tryFireRangedShot(): void {
    if (this.definition.behaviorType !== ENEMY_BEHAVIOR_TYPE.RANGED || this.rangedShotFired) {
      return;
    }
    if (!this.isPathClearToPlayer()) {
      return;
    }
    const elapsed = this.definition.attackDurationMs - this.attackRemainingMs;
    if (elapsed < this.definition.telegraphMs) {
      return;
    }
    this.rangedShotFired = true;
    const velocity = this.getPlayerVelocity?.() ?? { x: 0, y: 0 };
    const factor = this.definition.predictionFactor ?? 0;
    const aimX = this.player.x + velocity.x * factor;
    const aimY = this.player.y + velocity.y * factor;
    const dx = aimX - this.enemy.x;
    const dy = aimY - this.enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    this._attackDirection.set(dx / dist, dy / dist);
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

    this.updateMoveOrAttack(delta);
  }

  private approachVelocity(targetX: number, targetY: number, delta: number, accel = 620): void {
    const dt = Math.min(delta, 48) / 1000;
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    const dx = targetX - vx;
    const dy = targetY - vy;
    const dist = Math.hypot(dx, dy);
    const step = accel * dt;
    if (dist <= step || dist === 0) {
      this.body.setVelocity(targetX, targetY);
      return;
    }
    this.body.setVelocity(vx + (dx / dist) * step, vy + (dy / dist) * step);
  }

  private updateMoveOrAttack(delta: number): void {
    const ctx = this.behaviorContext();
    if (this._isAttacking) {
      this.aiState = 'ATTACK';
      this.applySpecialAttackMotion();
      this.refreshNavLabel();
      return;
    }

    if (this.recoverRemainingMs > 0) {
      this.recoverRemainingMs = Math.max(0, this.recoverRemainingMs - delta);
      this.aiState = 'RECOVER';
      this.body.setVelocity(0, 0);
      this.facePlayer();
      this.refreshNavLabel();
      return;
    }

    if (!ctx.isPlayerAlive) {
      const homeDist = Math.hypot(this.enemy.x - this.homeX, this.enemy.y - this.homeY);
      this.aiState = homeDist < 28 ? 'IDLE' : 'RETURN';
      this.approachVelocity(
        homeDist < 28 ? 0 : ((this.homeX - this.enemy.x) / homeDist) * this.moveSpeed * 0.6,
        homeDist < 28 ? 0 : ((this.homeY - this.enemy.y) / homeDist) * this.moveSpeed * 0.6,
        delta
      );
      this.refreshNavLabel();
      return;
    }

    const move = this.behavior.chooseMove(ctx);
    if (this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.IDLE) {
      this.aiState = 'IDLE';
      this.body.setVelocity(0, 0);
      this.refreshNavLabel();
      return;
    }
    if (move.hold) {
      this.aiState = this.attackCooldownRemainingMs > 0 ? 'RECOVER' : 'CHASE';
      this.lastNav = null;
      this.body.setVelocity(0, 0);
      this.facePlayer();
      this.tryStartAttack();
      this.refreshNavLabel();
      return;
    }

    const accel = this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE ? 240 : 620;
    const steered = this.steerAroundObstacles(move, ctx);
    this.approachVelocity(steered.vx, steered.vy, delta, accel);
    if (this.aiState === 'PATH_CHASE') {
      this.faceVector(steered.vx, steered.vy);
    } else {
      this.facePlayer();
    }
    this.tryStartAttack();
    this.refreshNavLabel();
  }

  private steerAroundObstacles(
    move: { vx: number; vy: number; goalX?: number; goalY?: number; needsLos?: boolean },
    ctx: EnemyBehaviorContext
  ): { vx: number; vy: number } {
    const goalX = move.goalX ?? ctx.playerX;
    const goalY = move.goalY ?? ctx.playerY;
    if (!this.navigation) {
      this.aiState = move.needsLos ? 'REPOSITION' : 'CHASE';
      return move;
    }
    const min = this.definition.preferredDistanceMin ?? 200;
    const max = this.definition.preferredDistanceMax ?? 360;
    const steer = this.navigation.steer({
      id: this._id,
      x: this.enemy.x,
      y: this.enemy.y,
      speed: Math.max(this.moveSpeed, Math.hypot(move.vx, move.vy)),
      goalX,
      goalY,
      now: this.enemy.scene.time.now,
      repathMs: this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE ? HEAVY_REPATH_MS : NAV_REPATH_MS,
      hold: false,
      forcePath:
        this.hitsObstacle?.(this.enemy.x + move.vx * 0.08, this.enemy.y + move.vy * 0.08, this.definition.size / 2) ===
        true,
      losRing: move.needsLos
        ? {
            min,
            preferred: (min + max) * 0.5,
            max,
            bias: (this._formationIndex / Math.max(1, this._aliveCount)) * Math.PI * 2,
          }
        : undefined,
      playerX: ctx.playerX,
      playerY: ctx.playerY,
    });
    this.lastNav = steer;
    const radius = this.definition.size / 2;
    const probeBlocked =
      this.hitsObstacle?.(this.enemy.x + move.vx * 0.08, this.enemy.y + move.vy * 0.08, radius) === true;
    const openChase = steer.mode === 'DIRECT_CHASE' && !probeBlocked && Math.hypot(move.vx, move.vy) > 8;
    if (openChase) {
      this.aiState = this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.RANGED ? 'REPOSITION' : 'CHASE';
      return move;
    }
    this.aiState = steer.mode === 'PATH_CHASE' ? 'PATH_CHASE' : 'CHASE';
    return { vx: steer.vx, vy: steer.vy };
  }

  private faceVector(x: number, y: number): void {
    if (x === 0 && y === 0) {
      this.facePlayer();
      return;
    }
    this._attackDirection.set(x, y);
    this._attackDirection.normalize();
  }

  private refreshNavLabel(): void {
    if (!isNavDebugEnabled()) {
      this.debugLabel.setVisible(false);
      return;
    }
    this.debugLabel.setVisible(true);
    this.debugLabel.setText(this.aiState);
  }

  private resolveAttackMove(): 'melee' | 'lunge' | 'charge' {
    const distance = this.distanceToPlayer();
    if (
      this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE &&
      distance > this.definition.attackRange &&
      distance <= (this.definition.chargeRangeMax ?? 300)
    ) {
      return 'charge';
    }
    if (
      this.definition.behaviorType === ENEMY_BEHAVIOR_TYPE.MELEE &&
      distance > this.definition.attackRange &&
      distance <= (this.definition.lungeRange ?? this.definition.attackRange)
    ) {
      return 'lunge';
    }
    return 'melee';
  }

  private applySpecialAttackMotion(): void {
    if (this.attackMove === 'charge') {
      const windup = this.definition.chargeWindupMs ?? 480;
      const duration = this.definition.chargeDurationMs ?? 380;
      const elapsed =
        (this.definition.chargeWindupMs ?? 480) +
        (this.definition.chargeDurationMs ?? 380) +
        (this.definition.chargeRecoveryMs ?? 640) -
        this.attackRemainingMs;
      if (elapsed < windup || elapsed > windup + duration) {
        this.body.setVelocity(0, 0);
        return;
      }
      const speed = this.definition.chargeSpeed ?? 390;
      const nextX = this.enemy.x + this.chargeLocked.x * speed * 0.016;
      const nextY = this.enemy.y + this.chargeLocked.y * speed * 0.016;
      if (this.hitsObstacle?.(nextX, nextY, this.definition.size / 2)) {
        this.attackRemainingMs = Math.min(this.attackRemainingMs, this.definition.chargeRecoveryMs ?? 640);
        this.body.setVelocity(0, 0);
        return;
      }
      this.body.setVelocity(this.chargeLocked.x * speed, this.chargeLocked.y * speed);
      return;
    }

    if (this.attackMove === 'lunge') {
      const elapsed = this.definition.attackDurationMs - this.attackRemainingMs;
      if (elapsed >= this.definition.hitStartMs && elapsed < this.definition.hitEndMs) {
        const speed = this.definition.lungeSpeed ?? 340;
        this.body.setVelocity(this._attackDirection.x * speed, this._attackDirection.y * speed);
        return;
      }
    }

    this.body.setVelocity(0, 0);
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

  /** AI never steers from an entrance point that is still outside the floor. */
  private containToWorld(): void {
    const bounds = this.body.world.bounds;
    const half = this.definition.size / 2;
    const inside =
      this.enemy.x >= bounds.x + half &&
      this.enemy.x <= bounds.right - half &&
      this.enemy.y >= bounds.y + half &&
      this.enemy.y <= bounds.bottom - half;
    if (inside) {
      return;
    }
    const x = Phaser.Math.Clamp(this.homeX, bounds.x + half, bounds.right - half);
    const y = Phaser.Math.Clamp(this.homeY, bounds.y + half, bounds.bottom - half);
    this.homeX = x;
    this.homeY = y;
    this.enemy.setPosition(x, y);
    this.body.reset(x, y);
    this.body.setEnable(true);
    this.body.setVelocity(0, 0);
  }

  private syncHpBar(): void {
    const asset = getEnemyAsset(this._typeId);
    const offsetY = Math.round(asset.visualSize * (asset.originY ?? 0.9) + 10);
    const barY = this.enemy.y - offsetY;
    const show = !this.overheadHidden && !this._isDead && this._currentHp < this._maxHp;
    this.hpBarBg.setVisible(show);
    this.hpBarFill.setVisible(show);
    this.hpBarBg.setPosition(this.enemy.x, barY);
    this.hpBarFill.setPosition(this.enemy.x - this.hpBarWidth / 2, barY);
    this.hpBarFill.displayWidth = Math.max(0, this.hpBarWidth * (this._currentHp / Math.max(1, this._maxHp)));
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
