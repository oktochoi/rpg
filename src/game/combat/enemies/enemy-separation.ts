export interface SeparableUnit {
  x: number;
  y: number;
  radius: number;
}

export interface SeparationDelta {
  dx: number;
  dy: number;
}

const DEFAULT_PADDING = 36;
const DEFAULT_STRENGTH = 1.15;
const MAX_PUSH = 18;

export function computeSeparationDeltas(
  units: readonly SeparableUnit[],
  padding = DEFAULT_PADDING,
  strength = DEFAULT_STRENGTH
): SeparationDelta[] {
  const deltas = units.map(() => ({ dx: 0, dy: 0 }));

  for (let i = 0; i < units.length; i += 1) {
    for (let j = i + 1; j < units.length; j += 1) {
      const a = units[i];
      const b = units[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius + padding;

      if (dist > minDist) {
        continue;
      }

      if (dist <= 0.001) {
        const push = Math.min(MAX_PUSH, minDist * 0.25);
        deltas[i].dx -= push;
        deltas[j].dx += push;
        continue;
      }

      const overlap = minDist - dist;
      const push = Math.min(MAX_PUSH, overlap * strength * 0.5);
      const nx = dx / dist;
      const ny = dy / dist;
      deltas[i].dx -= nx * push;
      deltas[i].dy -= ny * push;
      deltas[j].dx += nx * push;
      deltas[j].dy += ny * push;
    }
  }

  return deltas;
}

export function shouldApplyAttackHit(lastHitAttackId: number, attackId: number): boolean {
  return lastHitAttackId !== attackId;
}
