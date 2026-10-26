import * as Phaser from 'phaser';
import { AttackTokenBoard } from './attack-tokens';
import { createEnemyBehavior } from './behaviors/create-enemy-behavior';
import { getEnemyDefinition } from './enemy-definitions';
import { computeSeparationDeltas } from './enemy-separation';
import type { EnemyTypeId } from './enemy-types';
import { EnemyController } from './EnemyController';
import type { EnemyRangedShot, EnemySpawnRequest } from './enemy-runtime';
import { createEnemyVisual, type EnemyVisual } from '../visual';
import { planEnemyEntrance, type EntrancePace, type EntrancePlan, type EntranceSide } from '../encounters/encounter-intro';
import { buildNavGrid } from '../navigation/navigation-grid';
import { NavigationBoard } from '../navigation/navigation-board';
import { isNavDebugEnabled } from '../../debug/debug-flags';
import type { Rect } from '../arenas/arena-geometry';

interface ActiveEntrance {
  style: EntrancePlan['style'];
  startedAt: number;
  durationMs: number;
  facingX: number;
  targetX: number;
  targetY: number;
}

export class EnemyManager {
  private readonly enemies: EnemyController[] = [];
  private readonly usedIds = new Set<string>();
  private readonly visuals = new Map<string, EnemyVisual>();
  private readonly entrances = new Map<string, ActiveEntrance>();
  private concealed = false;
  private readonly tokens: AttackTokenBoard;
  private getPlayerVelocity: () => { x: number; y: number } = () => ({ x: 0, y: 0 });
  private hitsObstacle: (x: number, y: number, radius: number) => boolean = () => false;
  private navigation: NavigationBoard | null = null;
  private navGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc,
    private readonly isPlayerAlive: () => boolean,
    private readonly onRangedShot: (shot: EnemyRangedShot) => void,
    meleeSlots = 2
  ) {
    this.tokens = new AttackTokenBoard(meleeSlots);
  }

  setWorldQueries(
    getPlayerVelocity: () => { x: number; y: number },
    hitsObstacle: (x: number, y: number, radius: number) => boolean
  ): void {
    this.getPlayerVelocity = getPlayerVelocity;
    this.hitsObstacle = hitsObstacle;
  }

  setNavigation(
    solids: readonly Rect[],
    bounds: { x: number; y: number; width: number; height: number },
    contains?: (x: number, y: number) => boolean
  ): void {
    this.navigation = new NavigationBoard(buildNavGrid(bounds, solids, undefined, contains));
    if (isNavDebugEnabled() && !this.navGraphics) {
      this.navGraphics = this.scene.add.graphics();
      this.navGraphics.setDepth(15);
    }
  }

  spawnEnemy(request: EnemySpawnRequest): EnemyController {
    const visual = this.scene.add.rectangle(
      request.x,
      request.y,
      request.definition.size,
      request.definition.size,
      request.definition.color
    );
    visual.setAlpha(0);
    visual.setDepth(3);
    this.scene.physics.add.existing(visual);
    const enemy = new EnemyController(this.scene, visual, this.player, this.isPlayerAlive, {
      instanceId: request.instanceId,
      typeId: request.typeId,
      definition: request.definition,
      behavior: request.behavior,
      onRangedShot: this.onRangedShot,
      canGrantMeleeToken: (id) => this.tokens.canGrantMelee(id),
      tryAcquireMeleeToken: (id) => this.tokens.tryAcquireMelee(id),
      releaseMeleeToken: (id) => this.tokens.release(id),
      getPlayerVelocity: this.getPlayerVelocity,
      hitsObstacle: this.hitsObstacle,
      navigation: this.navigation ?? undefined,
    });
    visual.setData('instanceId', request.instanceId);
    this.usedIds.add(request.instanceId);
    this.enemies.push(enemy);
    this.visuals.set(request.instanceId, createEnemyVisual(this.scene, request.typeId, request.definition.size));
    return enemy;
  }

  spawnFromType(typeId: EnemyTypeId, instanceId: string, x: number, y: number): EnemyController {
    const definition = getEnemyDefinition(typeId);
    return this.spawnEnemy({
      instanceId,
      typeId,
      definition,
      behavior: createEnemyBehavior(definition.behaviorType),
      x,
      y,
    });
  }

  getEnemies(): readonly EnemyController[] {
    return this.enemies;
  }

  getAliveEnemies(): EnemyController[] {
    return this.enemies.filter((enemy) => !enemy.isDead);
  }

  getAliveCount(): number {
    return this.getAliveEnemies().length;
  }

  getByGameObject(target: Phaser.GameObjects.GameObject): EnemyController | undefined {
    return this.enemies.find((enemy) => enemy.gameObject === target);
  }

  getDefeatedInstanceIds(): string[] {
    return this.enemies.filter((enemy) => enemy.isDead).map((enemy) => enemy.id);
  }

  getDefeatedTypes(): EnemyTypeId[] {
    return this.enemies.filter((enemy) => enemy.isDead).map((enemy) => enemy.typeId);
  }

  haltAll(): void {
    for (const enemy of this.enemies) {
      enemy.halt();
    }
  }

  hideOverheads(): void {
    for (const enemy of this.enemies) {
      enemy.hideOverhead();
    }
  }

  /** Snap any in-progress entrance onto its walkable spawn before AI starts. */
  finishEntrances(): void {
    for (const enemy of this.enemies) {
      const entrance = this.entrances.get(enemy.id);
      this.scene.tweens.killTweensOf(enemy.gameObject);
      if (!entrance) {
        continue;
      }
      const body = enemy.gameObject.body as Phaser.Physics.Arcade.Body | undefined;
      enemy.gameObject.setPosition(entrance.targetX, entrance.targetY);
      body?.reset(entrance.targetX, entrance.targetY);
      body?.setVelocity(0, 0);
      body?.setCollideWorldBounds(true);
      body?.setEnable(true);
      enemy.adoptHome(entrance.targetX, entrance.targetY);
      this.entrances.delete(enemy.id);
    }
  }

  resumeAll(openingDelayMs?: (enemy: EnemyController, index: number) => number): void {
    this.finishEntrances();
    this.enemies.forEach((enemy, index) => {
      enemy.resume();
      const delay = openingDelayMs?.(enemy, index) ?? 0;
      if (delay > 0) {
        enemy.armFirstAttack(delay);
      }
    });
  }

  /**
   * Off-screen / materialize entrances before combat AI resumes.
   * Returns the longest tween duration in ms.
   */
  holdForEntrance(): void {
    this.concealed = true;
    for (const enemy of this.enemies) {
      if (enemy.isDead) {
        continue;
      }
      enemy.halt();
      const body = enemy.gameObject.body as Phaser.Physics.Arcade.Body | undefined;
      body?.setEnable(false);
    }
  }

  isEntering(id: string): boolean {
    return this.entrances.has(id);
  }

  playEntrances(
    bounds: { width: number; height: number; originX: number; originY: number },
    pace: EntrancePace = 'full',
    side: EntranceSide = 'alternate'
  ): number {
    this.concealed = false;
    let longest = 0;
    this.enemies.forEach((enemy, index) => {
      if (enemy.isDead) {
        return;
      }
      const targetX = enemy.gameObject.x;
      const targetY = enemy.gameObject.y;
      const plan = planEnemyEntrance(enemy.typeId, targetX, targetY, bounds, index, pace, side);
      longest = Math.max(longest, plan.durationMs);
      enemy.halt();
      const body = enemy.gameObject.body as Phaser.Physics.Arcade.Body | undefined;
      body?.setEnable(false);
      const facingX = plan.fromX === targetX ? (index % 2 === 0 ? -1 : 1) : Math.sign(targetX - plan.fromX);
      this.entrances.set(enemy.id, {
        style: plan.style,
        startedAt: this.scene.time.now,
        durationMs: plan.durationMs,
        facingX: facingX || -1,
        targetX,
        targetY,
      });
      const finish = () => {
        if (!this.entrances.has(enemy.id)) {
          return;
        }
        enemy.gameObject.setPosition(targetX, targetY);
        body?.reset(targetX, targetY);
        body?.setVelocity(0, 0);
        body?.setCollideWorldBounds(true);
        body?.setEnable(true);
        enemy.adoptHome(targetX, targetY);
        this.entrances.delete(enemy.id);
      };

      if (plan.style === 'stand') {
        finish();
        return;
      }

      if (plan.style === 'materialize' || plan.style === 'awaken') {
        enemy.gameObject.setPosition(targetX, targetY);
        this.scene.tweens.add({
          targets: enemy.gameObject,
          y: targetY,
          duration: plan.durationMs,
          ease: 'Sine.easeOut',
          onComplete: finish,
        });
        return;
      }

      body?.setCollideWorldBounds(false);
      enemy.gameObject.setPosition(plan.fromX, plan.fromY);
      this.scene.tweens.add({
        targets: enemy.gameObject,
        x: targetX,
        y: targetY,
        duration: plan.durationMs,
        ease: 'Sine.easeOut',
        onComplete: finish,
      });
    });
    return longest;
  }

  update(delta: number, bounds: { width: number; height: number }): void {
    this.navigation?.beginFrame();
    const alive = this.getAliveEnemies();
    alive.forEach((enemy, index) => {
      enemy.setFormation(index, alive.length);
    });
    for (const enemy of this.enemies) {
      enemy.update(delta);
      const visual = this.visuals.get(enemy.id);
      const entrance = this.entrances.get(enemy.id);
      const entranceT = entrance
        ? Math.min(1, (this.scene.time.now - entrance.startedAt) / Math.max(entrance.durationMs, 1))
        : undefined;
      const runningIn = entrance?.style === 'run_in' || entrance?.style === 'drop_back';
      visual?.update({
        x: enemy.gameObject.x,
        y: enemy.gameObject.y,
        facingX: entrance?.facingX ?? enemy.attackDirection.x,
        facingY: enemy.attackDirection.y,
        moving: (runningIn || this.isEnemyTranslating(enemy)) && !enemy.isDead && !enemy.isAttacking && !this.isEnemyRepositioning(enemy),
        entrance: entrance && entrance.style !== 'stand' ? entrance.style : undefined,
        concealed: this.concealed && !this.entrances.has(enemy.id),
        entranceT,
        dashing: this.isEnemyRepositioning(enemy),
        hit: enemy.isHit,
        dead: enemy.isDead,
        deadT: enemy.deathProgress,
        attacking: enemy.isAttacking,
        attackActive: enemy.isStrikePhase,
        delta,
        speed: this.actorSpeed(enemy, runningIn),
      });
    }
    this.applySeparation(bounds);
    this.drawNavigation();
  }

  destroyAll(): void {
    for (const visual of this.visuals.values()) {
      visual.destroy();
    }
    this.visuals.clear();
    this.entrances.clear();
    for (const enemy of this.enemies) {
      enemy.gameObject.destroy();
    }
    this.enemies.length = 0;
    this.usedIds.clear();
    this.tokens.reset();
    this.navGraphics?.destroy();
    this.navGraphics = null;
  }

  private drawNavigation(): void {
    const graphics = this.navGraphics;
    const board = this.navigation;
    if (!graphics || !board) {
      return;
    }
    graphics.clear();
    const grid = board.grid;
    graphics.fillStyle(0xc45c4a, 0.35);
    for (let row = 0; row < grid.rows; row += 1) {
      for (let col = 0; col < grid.cols; col += 1) {
        if (grid.cells[row * grid.cols + col] === 0) {
          continue;
        }
        graphics.fillRect(
          grid.originX + col * grid.cellSize,
          grid.originY + row * grid.cellSize,
          grid.cellSize - 1,
          grid.cellSize - 1
        );
      }
    }
    for (const enemy of this.enemies) {
      const view = enemy.navigationView;
      if (!view) {
        continue;
      }
      graphics.lineStyle(2, view.los ? 0x7dcea0 : 0xc45c4a, 0.9);
      graphics.beginPath();
      graphics.moveTo(enemy.gameObject.x, enemy.gameObject.y);
      graphics.lineTo(this.player.x, this.player.y);
      graphics.strokePath();
      if (view.path.length > 1) {
        graphics.lineStyle(2, 0xe6c15a, 0.95);
        graphics.beginPath();
        graphics.moveTo(view.path[0].x, view.path[0].y);
        for (const point of view.path.slice(1)) {
          graphics.lineTo(point.x, point.y);
        }
        graphics.strokePath();
      }
      if (view.waypoint) {
        graphics.fillStyle(0xe6c15a, 0.9);
        graphics.fillCircle(view.waypoint.x, view.waypoint.y, 4);
      }
      graphics.fillStyle(0x7eb6d9, 0.9);
      graphics.fillCircle(view.goal.x, view.goal.y, 3);
    }
  }

  private actorSpeed(enemy: EnemyController, entering: boolean): number {
    const body = enemy.gameObject.body as Phaser.Physics.Arcade.Body | undefined;
    const measured = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (measured > 24) {
      return measured;
    }
    return entering ? enemy.moveSpeed : 0;
  }

  private isEnemyTranslating(enemy: EnemyController): boolean {
    const body = enemy.gameObject.body as Phaser.Physics.Arcade.Body | undefined;
    return Boolean(body && body.velocity.lengthSq() > 16);
  }

  private isEnemyRepositioning(enemy: EnemyController): boolean {
    if (enemy.typeId !== 'archer' || enemy.isDead || enemy.isAttacking) {
      return false;
    }
    const body = enemy.gameObject.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body || body.velocity.lengthSq() <= 16) {
      return false;
    }
    const toPlayerX = this.player.x - enemy.gameObject.x;
    const toPlayerY = this.player.y - enemy.gameObject.y;
    return body.velocity.x * toPlayerX + body.velocity.y * toPlayerY < 0;
  }

  private applySeparation(_bounds: { width: number; height: number }): void {
    const alive = this.getAliveEnemies();
    const deltas = computeSeparationDeltas(
      alive.map((enemy) => ({
        x: enemy.gameObject.x,
        y: enemy.gameObject.y,
        radius: enemy.size / 2,
      }))
    );
    alive.forEach((enemy, index) => {
      if (this.entrances.has(enemy.id)) {
        return;
      }
      const delta = deltas[index];
      if (delta && (delta.dx !== 0 || delta.dy !== 0)) {
        enemy.applySeparation(delta.dx * 28, delta.dy * 28, 90);
      }
    });
  }
}
