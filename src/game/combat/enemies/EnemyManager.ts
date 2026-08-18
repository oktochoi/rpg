import * as Phaser from 'phaser';
import { AttackTokenBoard } from './attack-tokens';
import { createEnemyBehavior } from './behaviors/create-enemy-behavior';
import { getEnemyDefinition } from './enemy-definitions';
import { computeSeparationDeltas } from './enemy-separation';
import type { EnemyTypeId } from './enemy-types';
import { EnemyController } from './EnemyController';
import type { EnemyRangedShot, EnemySpawnRequest } from './enemy-runtime';
import { createEnemyVisual, type EnemyVisual } from '../visual';

export class EnemyManager {
  private readonly enemies: EnemyController[] = [];
  private readonly usedIds = new Set<string>();
  private readonly visuals = new Map<string, EnemyVisual>();
  private readonly tokens = new AttackTokenBoard(2);
  private getPlayerVelocity: () => { x: number; y: number } = () => ({ x: 0, y: 0 });
  private hitsObstacle: (x: number, y: number, radius: number) => boolean = () => false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc,
    private readonly isPlayerAlive: () => boolean,
    private readonly onRangedShot: (shot: EnemyRangedShot) => void
  ) {}

  setWorldQueries(
    getPlayerVelocity: () => { x: number; y: number },
    hitsObstacle: (x: number, y: number, radius: number) => boolean
  ): void {
    this.getPlayerVelocity = getPlayerVelocity;
    this.hitsObstacle = hitsObstacle;
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

  update(delta: number, bounds: { width: number; height: number }): void {
    const alive = this.getAliveEnemies();
    alive.forEach((enemy, index) => {
      enemy.setFormation(index, alive.length);
    });
    for (const enemy of this.enemies) {
      enemy.update(delta);
      const visual = this.visuals.get(enemy.id);
      visual?.update({
        x: enemy.gameObject.x,
        y: enemy.gameObject.y,
        facingX: enemy.attackDirection.x,
        facingY: enemy.attackDirection.y,
        moving: this.isEnemyTranslating(enemy) && !enemy.isDead && !enemy.isAttacking && !this.isEnemyRepositioning(enemy),
        dashing: this.isEnemyRepositioning(enemy),
        hit: enemy.isHit,
        dead: enemy.isDead,
        deadT: enemy.deathProgress,
        attacking: enemy.isAttacking,
        attackActive: enemy.isStrikePhase,
        delta,
      });
    }
    this.applySeparation(bounds);
  }

  destroyAll(): void {
    for (const visual of this.visuals.values()) {
      visual.destroy();
    }
    this.visuals.clear();
    for (const enemy of this.enemies) {
      enemy.gameObject.destroy();
    }
    this.enemies.length = 0;
    this.usedIds.clear();
    this.tokens.reset();
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

  private applySeparation(bounds: { width: number; height: number }): void {
    const alive = this.getAliveEnemies();
    const deltas = computeSeparationDeltas(
      alive.map((enemy) => ({
        x: enemy.gameObject.x,
        y: enemy.gameObject.y,
        radius: enemy.size / 2,
      }))
    );
    alive.forEach((enemy, index) => {
      const delta = deltas[index];
      if (delta && (delta.dx !== 0 || delta.dy !== 0)) {
        enemy.nudge(delta.dx, delta.dy, bounds);
      }
    });
  }
}
