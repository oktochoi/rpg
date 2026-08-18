import { BOSS_PATTERN_ID, type BossPatternId } from '../boss/boss-types';

export function selectWeightedBossPattern(
  distance: number,
  recent: readonly BossPatternId[],
  rng: () => number = Math.random
): BossPatternId {
  const near = distance < 118;
  const far = distance > 250;
  const weights: Record<BossPatternId, number> = near
    ? { heavy_slam: 0.62, projectile_burst: 0.28, charge: 0.1 }
    : far
      ? { heavy_slam: 0.16, projectile_burst: 0.34, charge: 0.5 }
      : { heavy_slam: 0.28, projectile_burst: 0.4, charge: 0.32 };

  const banned = bannedRepeat(recent);
  const entries = (Object.entries(weights) as [BossPatternId, number][]).filter(([id]) => id !== banned);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [id, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return id;
    }
  }
  return entries[0]?.[0] ?? BOSS_PATTERN_ID.HEAVY_SLAM;
}

export function bannedRepeat(recent: readonly BossPatternId[]): BossPatternId | null {
  if (recent.length < 2) {
    return null;
  }
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];
  return last === prev ? last : null;
}

export const GUARDIAN_RESIDUE = {
  durationMs: 1600,
  tickMs: 400,
  damage: 8,
  radius: 54,
} as const;
