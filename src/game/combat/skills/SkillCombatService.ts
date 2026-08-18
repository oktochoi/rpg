import * as Phaser from 'phaser';
import type { CombatHittable } from '../types/combat-hittable';
import type { CombatFeedback } from '../effects/CombatFeedback';
import type { PlayerController } from '../player/PlayerController';
import type { PlayerHealthController } from '../player/PlayerHealthController';
import { aimDirection } from '../projectiles/projectile-runtime';
import { backstabDamage, inRadius, isBackAttack } from './skill-combat-rules';
import type { SkillExecutionContext } from './skill-types';

interface PathStrike {
  attackId: number;
  damage: number;
  remainingMs: number;
  radius: number;
}

export class SkillCombatService {
  private nextAttackId = 20_000;
  private pathStrike: PathStrike | null = null;
  private shield: Phaser.GameObjects.Arc | null = null;
  private shieldRemainingMs = 0;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getPlayer: () => Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc | undefined,
    private readonly movement: PlayerController,
    private readonly health: PlayerHealthController,
    private readonly feedback: CombatFeedback,
    private readonly getEnemies: () => readonly CombatHittable[],
    private readonly onEnemyHit: (enemy: CombatHittable, damage: number) => void
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  chargeSlash(context: SkillExecutionContext): void {
    const direction = aimDirection(context.playerX, context.playerY, context.pointerX, context.pointerY);
    const durationMs = context.skill.durationMs ?? 180;
    const range = context.skill.range ?? 96;
    const speed = range / (durationMs / 1000);
    this.movement.startForcedMove(new Phaser.Math.Vector2(direction.x, direction.y), speed, durationMs, 80);
    this.pathStrike = {
      attackId: this.nextAttackId,
      damage: context.skill.damage ?? 45,
      remainingMs: durationMs,
      radius: 28,
    };
    this.nextAttackId += 1;
    this.feedback.playChargeArc(context.playerX, context.playerY, new Phaser.Math.Vector2(direction.x, direction.y));
  }

  guard(context: SkillExecutionContext): void {
    const durationMs = context.skill.durationMs ?? 1000;
    const reduction = context.skill.damageReduction ?? 0.7;
    this.health.startGuard(durationMs, reduction);
    this.shieldRemainingMs = durationMs;
    this.ensureShield();
    const player = this.getPlayer();
    if (player) {
      this.feedback.playGuardBurst(player.x, player.y, this.actorSize(player));
    }
  }

  frostNova(context: SkillExecutionContext): void {
    const player = this.getPlayer();
    const radius = context.skill.range ?? 108;
    if (player) {
      this.feedback.playNova(player.x, player.y, radius);
    }
    if (!player) {
      return;
    }
    const damage = context.skill.damage ?? 25;
    const attackId = this.nextAttackId;
    this.nextAttackId += 1;
    for (const enemy of this.aliveEnemies()) {
      if (!inRadius({ x: player.x, y: player.y }, { x: enemy.gameObject.x, y: enemy.gameObject.y }, radius)) {
        continue;
      }
      const applied = enemy.takeDamage({
        amount: damage,
        direction: new Phaser.Math.Vector2(enemy.gameObject.x - player.x, enemy.gameObject.y - player.y),
        attackId,
        knockbackScale: 0.7,
      });
      if (applied) {
        enemy.applySlow(context.skill.slowMultiplier ?? 0.4, context.skill.slowDurationMs ?? 1500);
        this.onEnemyHit(enemy, damage);
      }
    }
  }

  shadowDash(context: SkillExecutionContext): void {
    const direction = aimDirection(context.playerX, context.playerY, context.pointerX, context.pointerY);
    const durationMs = context.skill.durationMs ?? 140;
    const range = context.skill.range ?? 160;
    const speed = range / (durationMs / 1000);
    this.movement.startForcedMove(new Phaser.Math.Vector2(direction.x, direction.y), speed, durationMs, 70);
    this.pathStrike = {
      attackId: this.nextAttackId,
      damage: context.skill.damage ?? 30,
      remainingMs: durationMs,
      radius: 22,
    };
    this.nextAttackId += 1;
    this.feedback.playDashTrail(context.playerX, context.playerY, new Phaser.Math.Vector2(direction.x, direction.y));
  }

  backstab(context: SkillExecutionContext): void {
    const player = this.getPlayer();
    const range = context.skill.range ?? 48;
    if (!player) {
      return;
    }
    const enemy = this.nearestAlive(player.x, player.y, range);
    if (!enemy) {
      return;
    }
    const isBack = isBackAttack(
      { x: player.x, y: player.y },
      { x: enemy.gameObject.x, y: enemy.gameObject.y },
      { x: enemy.attackDirection.x, y: enemy.attackDirection.y }
    );
    const damage = backstabDamage(context.skill.damage ?? 35, context.skill.backDamage ?? 60, isBack);
    const applied = enemy.takeDamage({
      amount: damage,
      direction: new Phaser.Math.Vector2(enemy.gameObject.x - player.x, enemy.gameObject.y - player.y),
      attackId: this.nextAttackId,
      knockbackScale: isBack ? 1.1 : 0.7,
    });
    this.nextAttackId += 1;
    this.feedback.playSlash(
      player.x,
      player.y,
      new Phaser.Math.Vector2(enemy.gameObject.x - player.x, enemy.gameObject.y - player.y).normalize(),
      'backstab'
    );
    if (applied) {
      this.onEnemyHit(enemy, damage);
    }
  }

  update(deltaMs: number): void {
    if (this.destroyed) {
      return;
    }
    this.tickPathStrike(deltaMs);
    this.tickShield(deltaMs);
  }

  destroy(): void {
    this.destroyed = true;
    this.shield?.destroy();
    this.shield = null;
    this.pathStrike = null;
  }

  private aliveEnemies(): CombatHittable[] {
    return this.getEnemies().filter((enemy) => !enemy.isDead);
  }

  private nearestAlive(x: number, y: number, range: number): CombatHittable | undefined {
    let nearest: CombatHittable | undefined;
    let nearestDist = Number.POSITIVE_INFINITY;
    for (const enemy of this.aliveEnemies()) {
      const dist = Math.hypot(enemy.gameObject.x - x, enemy.gameObject.y - y);
      if (dist <= range && dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  private tickPathStrike(deltaMs: number): void {
    const strike = this.pathStrike;
    if (!strike) {
      return;
    }
    strike.remainingMs -= deltaMs;
    const player = this.getPlayer();
    if (player) {
      for (const enemy of this.aliveEnemies()) {
        if (this.destroyed || this.pathStrike !== strike) {
          return;
        }
        const hit = inRadius(
          { x: player.x, y: player.y },
          { x: enemy.gameObject.x, y: enemy.gameObject.y },
          strike.radius + enemy.size / 2
        );
        if (!hit) {
          continue;
        }
        const applied = enemy.takeDamage({
          amount: strike.damage,
          direction: new Phaser.Math.Vector2(enemy.gameObject.x - player.x, enemy.gameObject.y - player.y),
          attackId: strike.attackId,
          knockbackScale: 1.2,
        });
        if (applied) {
          this.onEnemyHit(enemy, strike.damage);
        }
      }
    }
    if (this.destroyed || this.pathStrike !== strike) {
      return;
    }
    if (strike.remainingMs <= 0) {
      this.pathStrike = null;
    }
  }

  private ensureShield(): void {
    const player = this.getPlayer();
    if (!player) {
      return;
    }
    if (!this.shield) {
      this.shield = this.scene.add.circle(player.x, player.y, this.actorSize(player) * 0.9, 0xe6d5a0, 0.16);
      this.shield.setStrokeStyle(2, 0xf4e6b8, 0.8);
      this.shield.setDepth(3);
    }
  }

  private tickShield(deltaMs: number): void {
    if (this.shieldRemainingMs <= 0) {
      this.shield?.destroy();
      this.shield = null;
      return;
    }
    this.shieldRemainingMs -= deltaMs;
    const player = this.getPlayer();
    if (player && this.shield) {
      this.shield.setPosition(player.x, player.y);
    }
    if (this.shieldRemainingMs <= 0) {
      this.shield?.destroy();
      this.shield = null;
    }
  }

  private actorSize(player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc): number {
    return player instanceof Phaser.GameObjects.Arc ? player.radius * 2 : player.width;
  }
}
