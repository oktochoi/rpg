import type { EnemyDamageHit } from '../enemies/EnemyController';

export interface CombatHittable {
  readonly id: string;
  readonly gameObject: { x: number; y: number };
  readonly isDead: boolean;
  readonly size: number;
  readonly attackDirection: { x: number; y: number };
  takeDamage(hit: EnemyDamageHit): boolean;
  applySlow(multiplier: number, durationMs: number): void;
}
