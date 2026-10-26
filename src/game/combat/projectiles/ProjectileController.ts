import * as Phaser from 'phaser';
import type { SkillExecutionContext } from '../skills/skill-types';
import type { CombatHittable } from '../types/combat-hittable';
import type { PlayerDamageHit } from '../player/PlayerHealthController';
import type { CombatBounds, CombatProjectile } from './projectile-types';
import { aimDirection, createProjectile, projectileHitsTarget, stepProjectile } from './projectile-runtime';
import { circleHitsRect } from '../arenas/arena-geometry';
import { damageNumberForStrike, readCombatHp } from '../attacks/basic-attack-strike';
import { createProjectileVisual, projectileKindFromSpawn, type ProjectileVisualObject } from '../visual/ProjectileVisual';

const FIREBALL_COLOR = 0xff7a3d;
const FIREBALL_RADIUS = 14;
const FIREBALL_DEFAULT_SPEED = 420;
const FIREBALL_DEFAULT_LIFETIME_MS = 1400;
const FIREBALL_DEFAULT_DAMAGE = 35;
const ENEMY_SHOT_COLOR = 0xffb060;

export interface SpawnProjectileOptions {
  skillId: string;
  x: number;
  y: number;
  pointerX?: number;
  pointerY?: number;
  dirX?: number;
  dirY?: number;
  speed: number;
  damage: number;
  lifetimeMs: number;
  radius: number;
  color: number;
  knockbackScale?: number;
  owner?: 'player' | 'enemy';
  sourceId?: string;
  /** Set only for a basic-attack projectile. Absent on skills. */
  critical?: boolean;
}

export interface ProjectilePlayerTarget {
  x: number;
  y: number;
  radius: number;
  isInvincible: boolean;
  takeDamage: (hit: PlayerDamageHit) => boolean;
}

export class ProjectileController {
  private readonly projectiles: TrackedProjectile[] = [];
  private nextId = 1;
  private nextAttackId = 10_000;

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyAll, this);
  }

  get alive(): readonly CombatProjectile[] {
    return this.projectiles.map((item) => item.state);
  }

  spawnFireball(context: SkillExecutionContext): CombatProjectile {
    return this.spawn({
      skillId: context.skill.id,
      x: context.playerX,
      y: context.playerY,
      pointerX: context.pointerX,
      pointerY: context.pointerY,
      speed: context.skill.projectileSpeed ?? FIREBALL_DEFAULT_SPEED,
      damage: context.skill.damage ?? FIREBALL_DEFAULT_DAMAGE,
      lifetimeMs: context.skill.durationMs ?? FIREBALL_DEFAULT_LIFETIME_MS,
      radius: FIREBALL_RADIUS,
      color: FIREBALL_COLOR,
      knockbackScale: 0.8,
      owner: 'player',
    });
  }

  spawnEnemyShot(params: {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    speed: number;
    damage: number;
    lifetimeMs: number;
    radius: number;
    sourceId?: string;
    color?: number;
    skillId?: string;
  }): CombatProjectile {
    return this.spawn({
      skillId: params.skillId ?? 'enemy_shot',
      x: params.x,
      y: params.y,
      dirX: params.dirX,
      dirY: params.dirY,
      speed: params.speed,
      damage: params.damage,
      lifetimeMs: params.lifetimeMs,
      radius: params.radius,
      color: params.color ?? ENEMY_SHOT_COLOR,
      knockbackScale: 0.7,
      owner: 'enemy',
      sourceId: params.sourceId,
    });
  }

  spawn(options: SpawnProjectileOptions): CombatProjectile {
    const direction =
      options.dirX !== undefined && options.dirY !== undefined
        ? aimDirection(0, 0, options.dirX, options.dirY)
        : aimDirection(options.x, options.y, options.pointerX ?? options.x + 1, options.pointerY ?? options.y);
    const projectile = createProjectile({
      id: this.nextId,
      skillId: options.skillId,
      x: options.x,
      y: options.y,
      dirX: direction.x,
      dirY: direction.y,
      speed: options.speed,
      damage: options.damage,
      lifetimeMs: options.lifetimeMs,
      radius: options.radius,
      attackId: this.nextAttackId,
      owner: options.owner ?? 'player',
      sourceId: options.sourceId,
    });
    this.nextId += 1;
    this.nextAttackId += 1;

    const visual = createProjectileVisual(
      this.scene,
      projectile.x,
      projectile.y,
      options.radius,
      projectileKindFromSpawn(options.skillId, options.owner ?? 'player', options.color),
      direction.x,
      direction.y
    );
    this.projectiles.push({
      state: projectile,
      visual,
      knockbackScale: options.knockbackScale ?? 1,
      critical: options.critical,
    });
    return projectile;
  }

  update(
    deltaMs: number,
    enemies: readonly CombatHittable[],
    player?: ProjectilePlayerTarget,
    onEnemyHit?: (enemy: CombatHittable, damage: number, critical?: boolean) => void,
    onPlayerHit?: (damage: number) => void,
    solids?: readonly { x: number; y: number; w: number; h: number }[]
  ): void {
    const bounds = this.bounds();
    for (const item of this.projectiles) {
      item.state = stepProjectile(item.state, deltaMs, bounds);
      if (!item.state.alive) {
        continue;
      }
      if (solids && projectileHitsSolid(item.state, solids)) {
        item.state = { ...item.state, alive: false };
        continue;
      }

      if (item.state.owner === 'enemy') {
        this.tryHitPlayer(item, player, onPlayerHit);
        continue;
      }

      this.tryHitEnemies(item, enemies, onEnemyHit);
    }

    this.syncVisuals();
  }

  destroyAll(): void {
    for (const item of this.projectiles) {
      item.visual.destroy();
    }
    this.projectiles.length = 0;
  }

  destroyOwned(owner: 'player' | 'enemy'): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const item = this.projectiles[index];
      if (item.state.owner === owner) {
        item.visual.destroy();
        this.projectiles.splice(index, 1);
      }
    }
  }

  destroyBySourceId(sourceId: string): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const item = this.projectiles[index];
      if (item.state.sourceId === sourceId) {
        item.visual.destroy();
        this.projectiles.splice(index, 1);
      }
    }
  }

  private tryHitEnemies(
    item: TrackedProjectile,
    enemies: readonly CombatHittable[],
    onEnemyHit?: (enemy: CombatHittable, damage: number, critical?: boolean) => void
  ): void {
    for (const enemy of enemies) {
      if (enemy.isDead) {
        continue;
      }
      const target = enemy.gameObject;
      if (!projectileHitsTarget(item.state, { x: target.x, y: target.y, radius: enemy.size / 2 })) {
        continue;
      }
      const before = readCombatHp(enemy);
      const applied = enemy.takeDamage({
        amount: item.state.damage,
        direction: new Phaser.Math.Vector2(item.state.dirX, item.state.dirY),
        attackId: item.state.attackId,
        knockbackScale: item.knockbackScale,
      });
      item.state = { ...item.state, alive: false };
      if (applied) {
        const shown =
          item.critical === undefined
            ? item.state.damage
            : damageNumberForStrike(before, readCombatHp(enemy), item.state.damage);
        onEnemyHit?.(enemy, shown, item.critical === true);
      }
      return;
    }
  }

  private tryHitPlayer(
    item: TrackedProjectile,
    player: ProjectilePlayerTarget | undefined,
    onPlayerHit?: (damage: number) => void
  ): void {
    if (!player) {
      return;
    }
    if (!projectileHitsTarget(item.state, { x: player.x, y: player.y, radius: player.radius })) {
      return;
    }
    if (player.isInvincible) {
      return;
    }
    const applied = player.takeDamage({
      amount: item.state.damage,
      direction: new Phaser.Math.Vector2(item.state.dirX, item.state.dirY),
      attackId: item.state.attackId,
    });
    item.state = { ...item.state, alive: false };
    if (applied) {
      onPlayerHit?.(item.state.damage);
    }
  }

  private bounds(): CombatBounds {
    const layout = this.scene.physics.world.bounds;
    return {
      left: layout.x,
      top: layout.y,
      right: layout.right,
      bottom: layout.bottom,
    };
  }

  private syncVisuals(): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const item = this.projectiles[index];
      if (!item.state.alive) {
        item.visual.destroy();
        this.projectiles.splice(index, 1);
      } else {
        item.visual.setPosition(item.state.x, item.state.y);
        item.visual.setRotation?.(Math.atan2(item.state.dirY, item.state.dirX));
      }
    }
  }
}

function projectileHitsSolid(
  projectile: CombatProjectile,
  solids: readonly { x: number; y: number; w: number; h: number }[]
): boolean {
  return solids.some((solid) => circleHitsRect({ x: projectile.x, y: projectile.y, radius: projectile.radius }, solid));
}

interface TrackedProjectile {
  state: CombatProjectile;
  visual: ProjectileVisualObject;
  knockbackScale: number;
  critical?: boolean;
}
