export type BasicAttackType = 'MELEE' | 'PROJECTILE';

export interface MeleeHitboxProfile {
  width: number;
  height: number;
  offset: number;
  activeStartMs: number;
  activeEndMs: number;
}

export interface ProjectileAttackProfile {
  speed: number;
  lifetimeMs: number;
  radius: number;
  color: number;
}

export interface BasicAttackProfile {
  id: string;
  type: BasicAttackType;
  damage: number;
  cooldownMs: number;
  durationMs: number;
  knockbackScale: number;
  hitbox: MeleeHitboxProfile;
  projectile?: ProjectileAttackProfile;
}
