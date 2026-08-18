export const COMBAT_DEPTH = {
  ground: 0,
  shadow: 1,
  telegraph: 2,
  body: 3,
  character: 4,
  projectile: 6,
  attackFx: 8,
  hpBar: 9,
  damageText: 12,
  hud: 20,
} as const;

export type CardinalFacing = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export function cardinalFromVector(x: number, y: number): CardinalFacing {
  if (Math.abs(x) >= Math.abs(y)) {
    return x >= 0 ? 'RIGHT' : 'LEFT';
  }
  return y >= 0 ? 'DOWN' : 'UP';
}
