import * as Phaser from 'phaser';
import type { CombatHittable } from '../types/combat-hittable';
import type { EnemyDamageHit } from '../enemies/EnemyController';
import {
  ENEMY_ATTACK_ACTIVE_ALPHA,
  ENEMY_ATTACK_HITBOX_COLOR,
  ENEMY_ATTACK_WINDUP_ALPHA,
  ENEMY_DEATH_END_SCALE,
  ENEMY_DEATH_FADE_MS,
  ENEMY_HIT_COLOR,
  ENEMY_HIT_FLASH_MS,
  ENEMY_KNOCKBACK_DURATION_MS,
  ENEMY_KNOCKBACK_SPEED,
} from '../enemies/EnemyConfig';
import { isCombatDebugEnabled } from '../../debug/debug-flags';
import { RUINS_GUARDIAN_CONFIG, bossSlowMultiplier } from './boss-config';
import { GUARDIAN_RESIDUE } from './pattern-selection';
import { createBossRuntime, shouldTriggerPhase2 } from './boss-definitions';
import { BossPatternController } from './BossPatternController';
import type { BossDefinition, BossRuntimeState, BossState, BossDebugSnapshot } from './boss-types';
import { BOSS_STATE } from './boss-types';
import type { BossPatternContext } from './patterns/boss-pattern-types';

const PHASE2_COLOR = 0x9a3d7a;
const TELEGRAPH_WINDUP = 0xf0d080;
const TELEGRAPH_ACTIVE = 0xe07050;
const IDLE_STOP_DISTANCE = 96;

export class BossController implements CombatHittable {
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly slamHitbox: Phaser.GameObjects.Rectangle;
  private readonly slamHitboxBody: Phaser.Physics.Arcade.Body;
  private readonly chargeHitbox: Phaser.GameObjects.Rectangle;
  private readonly chargeHitboxBody: Phaser.Physics.Arcade.Body;
  private readonly telegraph: Phaser.GameObjects.Graphics;
  private readonly debugLabel: Phaser.GameObjects.Text;
  private readonly phaseLabel: Phaser.GameObjects.Text;
  private coreRemnant: Phaser.GameObjects.Arc | null = null;
  private readonly knockbackVelocity = new Phaser.Math.Vector2();
  private readonly lockedDirection = new Phaser.Math.Vector2(1, 0);
  private readonly _attackDirection = new Phaser.Math.Vector2(1, 0);
  private readonly patternController: BossPatternController;
  private readonly runtime: BossRuntimeState;

  private telegraphKind: 'slam' | 'burst' | 'charge' | null = null;
  private slamHitboxActive = false;
  private chargeHitboxActive = false;
  private lastHitAttackId = -1;
  private attackIdCounter = 40_000;
  private hitFlashRemainingMs = 0;
  private knockbackRemainingMs = 0;
  private deathFadeRemainingMs = 0;
  private phaseTransitionRemainingMs = 0;
  private slowRemainingMs = 0;
  private slowMultiplier = 1;
  private halted = false;
  private _isHit = false;
  private lastPlayerPos = { x: 0, y: 0 };

  constructor(
    scene: Phaser.Scene,
    private readonly visual: Phaser.GameObjects.Rectangle,
    private readonly definition: BossDefinition,
    private readonly instanceId: string,
    private readonly getPlayerPosition: () => { x: number; y: number },
    private readonly getBounds: () => { width: number; height: number; originX?: number; originY?: number },
    private readonly fireEnemyShot: (shot: {
      x: number;
      y: number;
      dirX: number;
      dirY: number;
      speed: number;
      damage: number;
      lifetimeMs: number;
      radius: number;
      sourceId?: string;
    }) => void,
    private readonly onDeath?: () => void,
    private readonly spawnDangerZone?: (x: number, y: number, radius: number, durationMs: number, damage: number, tickMs: number) => void
  ) {
    this.runtime = createBossRuntime(definition, instanceId);
    this.patternController = new BossPatternController(definition);
    this.body = visual.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0, 0);
    this.body.setImmovable(true);

    this.slamHitbox = scene.add.rectangle(
      0,
      0,
      RUINS_GUARDIAN_CONFIG.heavySlam.width,
      RUINS_GUARDIAN_CONFIG.heavySlam.range,
      ENEMY_ATTACK_HITBOX_COLOR,
      ENEMY_ATTACK_WINDUP_ALPHA
    );
    this.slamHitbox.setVisible(false);
    this.slamHitbox.setDepth(1);
    scene.physics.add.existing(this.slamHitbox);
    this.slamHitboxBody = this.slamHitbox.body as Phaser.Physics.Arcade.Body;
    this.slamHitboxBody.setAllowGravity(false);
    this.slamHitboxBody.setImmovable(true);
    this.slamHitboxBody.setEnable(false);

    this.chargeHitbox = scene.add.rectangle(
      0,
      0,
      definition.size + 12,
      definition.size + 8,
      ENEMY_ATTACK_HITBOX_COLOR,
      ENEMY_ATTACK_ACTIVE_ALPHA
    );
    this.chargeHitbox.setVisible(false);
    this.chargeHitbox.setDepth(1);
    scene.physics.add.existing(this.chargeHitbox);
    this.chargeHitboxBody = this.chargeHitbox.body as Phaser.Physics.Arcade.Body;
    this.chargeHitboxBody.setAllowGravity(false);
    this.chargeHitboxBody.setImmovable(true);
    this.chargeHitboxBody.setEnable(false);

    this.telegraph = scene.add.graphics();
    this.telegraph.setDepth(2);

    this.debugLabel = scene.add.text(0, 0, definition.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ece6d9',
    });
    this.debugLabel.setOrigin(0.5, 1);
    this.debugLabel.setDepth(4);
    this.debugLabel.setVisible(isCombatDebugEnabled());

    this.phaseLabel = scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#f0d080',
    });
    this.phaseLabel.setOrigin(0.5, 1);
    this.phaseLabel.setDepth(5);
    this.phaseLabel.setVisible(false);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get id(): string {
    return this.instanceId;
  }

  get bossId(): string {
    return this.definition.id;
  }

  get gameObject(): Phaser.GameObjects.Rectangle {
    return this.visual;
  }

  get slamHitboxObject(): Phaser.GameObjects.Rectangle {
    return this.slamHitbox;
  }

  get chargeHitboxObject(): Phaser.GameObjects.Rectangle {
    return this.chargeHitbox;
  }

  get isDead(): boolean {
    return this.runtime.isDead;
  }

  get isHit(): boolean {
    return this._isHit;
  }

  get size(): number {
    return this.definition.size;
  }

  get maxHp(): number {
    return this.definition.maxHp;
  }

  get currentHp(): number {
    return this.runtime.currentHp;
  }

  get currentPhase(): 1 | 2 {
    return this.runtime.currentPhase;
  }

  get isTransitioningPhase(): boolean {
    return this.runtime.isTransitioningPhase;
  }

  get deathProgress(): number {
    if (!this.runtime.isDead) {
      return 0;
    }
    return 1 - Math.max(0, this.deathFadeRemainingMs / (ENEMY_DEATH_FADE_MS + 180));
  }

  get state(): BossState {
    return this.runtime.state;
  }

  get slamDamage(): number {
    return RUINS_GUARDIAN_CONFIG.heavySlam.damage;
  }

  get chargeDamage(): number {
    return RUINS_GUARDIAN_CONFIG.charge.damage;
  }

  get slamAttackId(): number {
    return this.attackIdCounter;
  }

  get chargeAttackId(): number {
    return this.attackIdCounter;
  }

  get attackDirection(): { x: number; y: number } {
    return this._attackDirection;
  }

  get name(): string {
    return this.definition.name;
  }

  debugSnapshot(): BossDebugSnapshot {
    return {
      hp: this.runtime.currentHp,
      maxHp: this.definition.maxHp,
      phase: this.runtime.currentPhase,
      state: this.runtime.state,
      patternId: this.runtime.currentPatternId,
      nextPatternId: this.patternController.peekNextPatternId(this.runtime.currentPhase),
      cooldownMs: Math.round(this.runtime.patternCooldownRemainingMs),
    };
  }

  isSlamHitboxActive(): boolean {
    return this.slamHitboxActive && !this.runtime.isDead;
  }

  isChargeHitboxActive(): boolean {
    return this.chargeHitboxActive && !this.runtime.isDead;
  }

  halt(): void {
    this.halted = true;
    this.patternController.cancel(this.patternContext());
    this.clearAttackVisuals();
    this.body.setVelocity(0, 0);
    this.runtime.isAttacking = false;
    this.runtime.currentPatternId = undefined;
    if (!this.runtime.isDead) {
      this.runtime.state = BOSS_STATE.IDLE;
    }
  }

  /** Clears halt after boss awakening intro. */
  resume(): void {
    if (this.runtime.isDead) {
      return;
    }
    this.halted = false;
  }

  applySlow(multiplier: number, durationMs: number): void {
    if (this.runtime.isDead) {
      return;
    }
    this.slowMultiplier = bossSlowMultiplier(multiplier, this.definition.statusResistance.slowEffectiveness);
    this.slowRemainingMs = Math.max(this.slowRemainingMs, durationMs);
  }

  takeDamage(hit: EnemyDamageHit): boolean {
    if (this.runtime.isDead || this.runtime.isTransitioningPhase || hit.amount <= 0 || this.lastHitAttackId === hit.attackId) {
      return false;
    }

    this.lastHitAttackId = hit.attackId;
    const dealt = Math.max(1, Math.round(hit.amount * 0.75));
    this.runtime.currentHp = Math.max(0, this.runtime.currentHp - dealt);
    this.playHitFeedback();
    this.startKnockback(hit.direction, (hit.knockbackScale ?? 1) * RUINS_GUARDIAN_CONFIG.knockbackScale);

    if (this.runtime.currentHp <= 0) {
      this.beginDeath();
      return true;
    }

    this.tryBeginPhaseTransition();
    return true;
  }

  update(delta: number): void {
    if (this.runtime.isDead) {
      this.tickDeath(delta);
      this.syncLabels();
      return;
    }

    this.tickHitFlash(delta);
    this.tickSlow(delta);
    this.faceLockedOrPlayer();

    if (this.halted) {
      this.body.setVelocity(0, 0);
      this.clearAttackVisuals();
      this.syncLabels();
      return;
    }

    if (this.runtime.isTransitioningPhase) {
      this.tickPhaseTransition(delta);
      this.syncLabels();
      return;
    }

    this.tickKnockback(delta);
    this.patternController.update(delta, this.runtime, this.patternContext());
    if (!this.runtime.isAttacking && this.knockbackRemainingMs <= 0) {
      this.runtime.state = BOSS_STATE.IDLE;
      this.idleChase();
    }
    this.syncHitboxes();
    this.syncLabels();
  }

  consumeMeleeAttackId(): number {
    this.attackIdCounter += 1;
    return this.attackIdCounter;
  }

  private tryBeginPhaseTransition(): void {
    if (!shouldTriggerPhase2(this.runtime, this.definition.maxHp)) {
      return;
    }
    this.runtime.phaseTransitionTriggered = true;
    this.runtime.isTransitioningPhase = true;
    this.runtime.state = BOSS_STATE.PHASE_TRANSITION;
    this.phaseTransitionRemainingMs = RUINS_GUARDIAN_CONFIG.phaseTransitionMs;
    this.patternController.cancel(this.patternContext());
    this.runtime.isAttacking = false;
    this.runtime.currentPatternId = undefined;
    this.clearAttackVisuals();
    this.body.setVelocity(0, 0);
    this.knockbackRemainingMs = 0;
    this.visual.setFillStyle(PHASE2_COLOR);
    this.visual.setScale(1.12);
    if (isCombatDebugEnabled()) {
      this.phaseLabel.setText('PHASE 2');
      this.phaseLabel.setVisible(true);
    }
  }

  private tickPhaseTransition(delta: number): void {
    this.body.setVelocity(0, 0);
    this.phaseTransitionRemainingMs -= delta;
    const pulse = 1.08 + 0.08 * Math.sin(this.phaseTransitionRemainingMs / 70);
    this.visual.setScale(pulse);
    if (this.phaseTransitionRemainingMs > 0) {
      return;
    }
    this.runtime.isTransitioningPhase = false;
    this.runtime.currentPhase = 2;
    this.runtime.state = BOSS_STATE.IDLE;
    this.runtime.patternCooldownRemainingMs = RUINS_GUARDIAN_CONFIG.phase2DelayMs;
    this.patternController.beginPhase(2);
    this.visual.setScale(1.08);
    this.visual.setFillStyle(PHASE2_COLOR);
  }

  private beginDeath(): void {
    this.runtime.isDead = true;
    this.runtime.state = BOSS_STATE.DEAD;
    this.runtime.isAttacking = false;
    this.runtime.currentPatternId = undefined;
    this.runtime.isTransitioningPhase = false;
    this.patternController.destroy(this.patternContext());
    this.clearAttackVisuals();
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    this.deathFadeRemainingMs = ENEMY_DEATH_FADE_MS + 180;
    if (!this.coreRemnant) {
      this.coreRemnant = this.visual.scene.add.circle(this.visual.x, this.visual.y + 24, 16, 0x8fd4ff, 0.95);
      this.coreRemnant.setStrokeStyle(4, 0xd7b4ff, 0.95);
      this.coreRemnant.setDepth(6);
    }
    this.onDeath?.();
  }

  private tickDeath(delta: number): void {
    if (this.deathFadeRemainingMs <= 0) {
      return;
    }
    this.deathFadeRemainingMs -= delta;
    const t = 1 - Math.max(0, this.deathFadeRemainingMs / (ENEMY_DEATH_FADE_MS + 180));
    const fade = 1 - t;
    this.visual.setAlpha(fade);
    this.visual.setScale((this.runtime.currentPhase === 2 ? 1.08 : 1) - t * (1 - ENEMY_DEATH_END_SCALE));
    this.debugLabel.setAlpha(fade);
    this.phaseLabel.setAlpha(fade);
    if (this.deathFadeRemainingMs <= 0) {
      this.visual.setVisible(false);
      this.debugLabel.setVisible(false);
      this.phaseLabel.setVisible(false);
    }
  }

  private idleChase(): void {
    const player = this.getPlayerPosition();
    const dx = player.x - this.visual.x;
    const dy = player.y - this.visual.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= IDLE_STOP_DISTANCE) {
      this.body.setVelocity(0, 0);
      return;
    }
    const speed = this.definition.moveSpeed * this.slowMultiplier;
    this.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
  }

  private startKnockback(direction: Phaser.Math.Vector2, scale: number): void {
    if (this.runtime.state === BOSS_STATE.ATTACKING || this.runtime.state === BOSS_STATE.WINDUP) {
      return;
    }
    if (direction.x === 0 && direction.y === 0) {
      return;
    }
    this.knockbackVelocity.copy(direction).normalize().scale(ENEMY_KNOCKBACK_SPEED * scale);
    this.knockbackRemainingMs = ENEMY_KNOCKBACK_DURATION_MS;
  }

  private tickKnockback(delta: number): void {
    if (this.knockbackRemainingMs <= 0) {
      return;
    }
    this.knockbackRemainingMs -= delta;
    this.body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
    if (this.knockbackRemainingMs <= 0) {
      this.knockbackRemainingMs = 0;
      this.knockbackVelocity.set(0, 0);
    }
  }

  private playHitFeedback(): void {
    this._isHit = true;
    this.hitFlashRemainingMs = ENEMY_HIT_FLASH_MS;
    this.visual.setFillStyle(ENEMY_HIT_COLOR);
  }

  private tickHitFlash(delta: number): void {
    if (this.hitFlashRemainingMs <= 0) {
      return;
    }
    this.hitFlashRemainingMs -= delta;
    if (this.hitFlashRemainingMs <= 0) {
      this.hitFlashRemainingMs = 0;
      this._isHit = false;
      if (!this.runtime.isDead) {
        this.visual.setFillStyle(this.bodyColor());
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

  private bodyColor(): number {
    return this.runtime.currentPhase === 2 || this.runtime.isTransitioningPhase ? PHASE2_COLOR : this.definition.color;
  }

  private faceLockedOrPlayer(): void {
    if (this.runtime.isAttacking) {
      this._attackDirection.copy(this.lockedDirection);
      return;
    }
    const player = this.getPlayerPosition();
    this._attackDirection.set(player.x - this.visual.x, player.y - this.visual.y);
    if (this._attackDirection.lengthSq() === 0) {
      this._attackDirection.set(1, 0);
      return;
    }
    this._attackDirection.normalize();
  }

  private patternContext(): BossPatternContext {
    const player = this.getPlayerPosition();
    const playerVx = player.x - this.lastPlayerPos.x;
    const playerVy = player.y - this.lastPlayerPos.y;
    this.lastPlayerPos = player;
    const bounds = this.getBounds();
    return {
      x: this.visual.x,
      y: this.visual.y,
      playerX: player.x,
      playerY: player.y,
      playerVx,
      playerVy,
      width: bounds.width,
      height: bounds.height,
      originX: bounds.originX ?? 0,
      originY: bounds.originY ?? 0,
      size: this.definition.size,
      phase: this.runtime.currentPhase,
      lockDirection: (dirX, dirY) => {
        this.lockedDirection.set(dirX, dirY);
        if (this.lockedDirection.lengthSq() === 0) {
          this.lockedDirection.set(1, 0);
        } else {
          this.lockedDirection.normalize();
        }
        this._attackDirection.copy(this.lockedDirection);
      },
      getLockedDirection: () => ({ x: this.lockedDirection.x, y: this.lockedDirection.y }),
      setVelocity: (vx, vy) => {
        this.body.setVelocity(vx * this.slowMultiplier, vy * this.slowMultiplier);
      },
      setState: (state) => {
        this.runtime.state = state;
      },
      showTelegraph: (kind) => {
        this.telegraphKind = kind;
        this.drawTelegraph(kind);
      },
      hideTelegraph: () => {
        this.telegraphKind = null;
        this.telegraph.clear();
      },
      setHitboxActive: (active, kind) => {
        if (kind === 'slam') {
          if (active && !this.slamHitboxActive) {
            this.consumeMeleeAttackId();
          }
          this.slamHitboxActive = active;
        } else {
          if (active && !this.chargeHitboxActive) {
            this.consumeMeleeAttackId();
          }
          this.chargeHitboxActive = active;
        }
        this.syncHitboxes();
      },
      fireProjectiles: (shots) => {
        for (const shot of shots) {
          this.fireEnemyShot({
            x: shot.originX,
            y: shot.originY,
            dirX: shot.dirX,
            dirY: shot.dirY,
            speed: shot.speed,
            damage: shot.damage,
            lifetimeMs: shot.lifetimeMs,
            radius: shot.radius,
            sourceId: shot.sourceId ?? this.instanceId,
          });
        }
      },
      spawnResidue: (x, y) => {
        if (this.runtime.currentPhase !== 2) {
          return;
        }
        this.spawnDangerZone?.(x, y, GUARDIAN_RESIDUE.radius, GUARDIAN_RESIDUE.durationMs, GUARDIAN_RESIDUE.damage, GUARDIAN_RESIDUE.tickMs);
      },
      clampToArena: () => this.clampToArena(),
      sourceId: this.instanceId,
    };
  }

  private clampToArena(): boolean {
    const bounds = this.getBounds();
    const half = this.definition.size / 2;
    const originX = bounds.originX ?? 0;
    const originY = bounds.originY ?? 0;
    const minX = originX + half;
    const maxX = originX + bounds.width - half;
    const minY = originY + half;
    const maxY = originY + bounds.height - half;
    const hit =
      this.visual.x <= minX + 1 || this.visual.x >= maxX - 1 || this.visual.y <= minY + 1 || this.visual.y >= maxY - 1;
    this.visual.x = Phaser.Math.Clamp(this.visual.x, minX, maxX);
    this.visual.y = Phaser.Math.Clamp(this.visual.y, minY, maxY);
    if (hit) {
      this.body.setVelocity(0, 0);
    }
    return hit;
  }

  private drawTelegraph(kind: 'slam' | 'burst' | 'charge'): void {
    this.telegraph.clear();
    const dir = this.lockedDirection;
    const color = this.runtime.state === BOSS_STATE.ATTACKING ? TELEGRAPH_ACTIVE : TELEGRAPH_WINDUP;
    const alpha = this.runtime.state === BOSS_STATE.ATTACKING ? 0.38 : 0.22;
    this.telegraph.fillStyle(color, alpha);
    this.telegraph.lineStyle(2, color, 0.85);

    if (kind === 'slam') {
      const radius = RUINS_GUARDIAN_CONFIG.heavySlam.range / 2;
      this.telegraph.fillCircle(this.visual.x, this.visual.y, radius);
      this.telegraph.strokeCircle(this.visual.x, this.visual.y, radius);
      return;
    }

    if (kind === 'burst') {
      const count = this.runtime.currentPhase === 2 ? RUINS_GUARDIAN_CONFIG.projectileBurst.phase2Count : RUINS_GUARDIAN_CONFIG.projectileBurst.count;
      const spread = RUINS_GUARDIAN_CONFIG.projectileBurst.spreadDeg;
      const mid = (count - 1) / 2;
      for (let index = 0; index < count; index += 1) {
        const rad = dir.angle() + ((index - mid) * spread * Math.PI) / 180;
        const tx = this.visual.x + Math.cos(rad) * 90;
        const ty = this.visual.y + Math.sin(rad) * 90;
        this.telegraph.lineBetween(this.visual.x, this.visual.y, tx, ty);
      }
      return;
    }

    const length = Math.min(
      280,
      RUINS_GUARDIAN_CONFIG.charge.speed * (RUINS_GUARDIAN_CONFIG.charge.durationMs / 1000)
    );
    const cx = this.visual.x + dir.x * (length / 2);
    const cy = this.visual.y + dir.y * (length / 2);
    this.drawOrientedRect(cx, cy, 36, length, dir.angle());
  }

  private drawOrientedRect(cx: number, cy: number, width: number, height: number, rotation: number): void {
    this.telegraph.save();
    this.telegraph.translateCanvas(cx, cy);
    this.telegraph.rotateCanvas(rotation);
    this.telegraph.fillRect(-height / 2, -width / 2, height, width);
    this.telegraph.strokeRect(-height / 2, -width / 2, height, width);
    this.telegraph.restore();
  }

  private syncHitboxes(): void {
    const dir = this.lockedDirection;
    const slamRange = RUINS_GUARDIAN_CONFIG.heavySlam.range;
    this.slamHitbox.setPosition(this.visual.x, this.visual.y);
    this.slamHitbox.setRotation(0);
    this.slamHitbox.setSize(slamRange, slamRange);
    this.slamHitboxBody.setSize(slamRange, slamRange);
    this.slamHitbox.setVisible(this.telegraphKind === 'slam' || this.slamHitboxActive);
    this.slamHitbox.setAlpha(this.slamHitboxActive ? ENEMY_ATTACK_ACTIVE_ALPHA : ENEMY_ATTACK_WINDUP_ALPHA);
    this.slamHitboxBody.setEnable(this.slamHitboxActive && !this.runtime.isDead);

    this.chargeHitbox.setPosition(this.visual.x, this.visual.y);
    this.chargeHitbox.setRotation(dir.angle());
    this.chargeHitbox.setVisible(this.chargeHitboxActive);
    this.chargeHitboxBody.setEnable(this.chargeHitboxActive && !this.runtime.isDead);

    if (this.telegraphKind) {
      this.drawTelegraph(this.telegraphKind);
    }
  }

  private clearAttackVisuals(): void {
    this.slamHitboxActive = false;
    this.chargeHitboxActive = false;
    this.telegraphKind = null;
    this.telegraph.clear();
    this.slamHitbox.setVisible(false);
    this.chargeHitbox.setVisible(false);
    this.slamHitboxBody.setEnable(false);
    this.chargeHitboxBody.setEnable(false);
  }

  private syncLabels(): void {
    const top = this.visual.y - this.definition.size / 2 - 10;
    this.debugLabel.setPosition(this.visual.x, top);
    this.phaseLabel.setPosition(this.visual.x, top - 16);
    if (isCombatDebugEnabled() && this.runtime.currentPhase === 2 && !this.runtime.isDead) {
      this.phaseLabel.setVisible(true);
      this.phaseLabel.setText('PHASE 2');
    } else if (!isCombatDebugEnabled()) {
      this.phaseLabel.setVisible(false);
    }
  }

  private destroy = (): void => {
    this.patternController.destroy(this.patternContext());
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    this.slamHitboxBody.setEnable(false);
    this.chargeHitboxBody.setEnable(false);
    this.telegraph.destroy();
    this.slamHitbox.destroy();
    this.chargeHitbox.destroy();
    this.coreRemnant?.destroy();
    this.debugLabel.destroy();
    this.phaseLabel.destroy();
  };
}
