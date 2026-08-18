import type { CombatBounds, CombatProjectile, ProjectileTarget } from './projectile-types';

export function aimDirection(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return { x: 1, y: 0 };
  }
  return { x: dx / length, y: dy / length };
}

export function createProjectile(params: {
  id: number;
  skillId: string;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  damage: number;
  lifetimeMs: number;
  radius: number;
  attackId: number;
  owner?: 'player' | 'enemy';
  sourceId?: string;
}): CombatProjectile {
  const direction = aimDirection(0, 0, params.dirX, params.dirY);
  return {
    id: params.id,
    skillId: params.skillId,
    x: params.x,
    y: params.y,
    dirX: direction.x,
    dirY: direction.y,
    speed: params.speed,
    damage: params.damage,
    owner: params.owner ?? 'player',
    sourceId: params.sourceId,
    lifetimeRemainingMs: params.lifetimeMs,
    radius: params.radius,
    attackId: params.attackId,
    alive: true,
  };
}

export function stepProjectile(projectile: CombatProjectile, deltaMs: number, bounds: CombatBounds): CombatProjectile {
  if (!projectile.alive) {
    return projectile;
  }

  const nextLifetime = projectile.lifetimeRemainingMs - deltaMs;
  const next: CombatProjectile = {
    ...projectile,
    x: projectile.x + projectile.dirX * projectile.speed * (deltaMs / 1000),
    y: projectile.y + projectile.dirY * projectile.speed * (deltaMs / 1000),
    lifetimeRemainingMs: nextLifetime,
    alive: nextLifetime > 0 && !isOutOfBounds(projectile, bounds),
  };

  if (isOutOfBounds(next, bounds)) {
    return { ...next, alive: false };
  }

  return next;
}

export function isOutOfBounds(projectile: CombatProjectile, bounds: CombatBounds): boolean {
  return (
    projectile.x + projectile.radius < bounds.left ||
    projectile.x - projectile.radius > bounds.right ||
    projectile.y + projectile.radius < bounds.top ||
    projectile.y - projectile.radius > bounds.bottom
  );
}

export function projectileHitsTarget(projectile: CombatProjectile, target: ProjectileTarget): boolean {
  if (!projectile.alive) {
    return false;
  }
  const distance = Math.hypot(projectile.x - target.x, projectile.y - target.y);
  return distance <= projectile.radius + target.radius;
}

export function updateProjectiles(
  projectiles: readonly CombatProjectile[],
  deltaMs: number,
  bounds: CombatBounds
): CombatProjectile[] {
  return projectiles
    .map((projectile) => stepProjectile(projectile, deltaMs, bounds))
    .filter((projectile) => projectile.alive);
}
