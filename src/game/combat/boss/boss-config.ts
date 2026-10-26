import type { RuinsGuardianConfig } from './boss-types';

export const RUINS_GUARDIAN_CONFIG: RuinsGuardianConfig = {
  phaseThreshold: 0.82,
  phaseTransitionMs: 1400,
  phase1DelayMs: 700,
  phase2DelayMs: 420,
  slowEffectiveness: 0.33,
  knockbackScale: 0.22,
  heavySlam: {
    damage: 34,
    windUpMs: 980,
    activeMs: 220,
    recoveryMs: 520,
    range: 220,
    width: 220,
    phase2WindUpMs: 680,
  },
  projectileBurst: {
    damage: 16,
    count: 3,
    phase2Count: 5,
    spreadDeg: 18,
    anglesPhase1: [-18, 0, 18],
    anglesPhase2: [-32, -16, 0, 16, 32],
    speed: 210,
    lifetimeMs: 1800,
    radius: 9,
    windUpMs: 780,
    recoveryMs: 420,
  },
  charge: {
    damage: 32,
    windUpMs: 820,
    speed: 340,
    phase2Speed: 460,
    durationMs: 780,
    recoveryMs: 620,
    knockbackScale: 1.15,
  },
};

export function bossSlowMultiplier(incomingMultiplier: number, effectiveness = RUINS_GUARDIAN_CONFIG.slowEffectiveness): number {
  const reduction = 1 - Math.max(0, Math.min(1, incomingMultiplier));
  return Math.max(0.35, 1 - reduction * effectiveness);
}
