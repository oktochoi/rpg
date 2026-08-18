export interface CombatBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CombatProjectile {
  id: number;
  skillId: string;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  damage: number;
  owner: 'player' | 'enemy';
  sourceId?: string;
  lifetimeRemainingMs: number;
  radius: number;
  attackId: number;
  alive: boolean;
}

export interface ProjectileTarget {
  x: number;
  y: number;
  radius: number;
}
