import type { RuinsGuardianConfig } from './boss-types';

export const RUINS_GUARDIAN_CONFIG: RuinsGuardianConfig = {
  phaseThreshold: 0.5,
  phaseTransitionMs: 900,
  phase1DelayMs: 1100,
  phase2DelayMs: 750,
  slowEffectiveness: 0.33,
  knockbackScale: 0.22,
  heavySlam: {
    damage: 30,
    windUpMs: 700,
    activeMs: 200,
    recoveryMs: 600,
    range: 92,
    width: 110,
    phase2WindUpMs: 520,
  },
  projectileBurst: {
    damage: 14,
    count: 3,
    phase2Count: 5,
    spreadDeg: 15,
    anglesPhase1: [-15, 0, 15],
    anglesPhase2: [-30, -15, 0, 15, 30],
    speed: 280,
    lifetimeMs: 1600,
    radius: 8,
    windUpMs: 500,
    recoveryMs: 450,
  },
  charge: {
    damage: 35,
    windUpMs: 600,
    speed: 420,
    phase2Speed: 520,
    durationMs: 700,
    recoveryMs: 550,
    knockbackScale: 1.15,
  },
};

export function bossSlowMultiplier(incomingMultiplier: number, effectiveness = RUINS_GUARDIAN_CONFIG.slowEffectiveness): number {
  const reduction = 1 - Math.max(0, Math.min(1, incomingMultiplier));
  return Math.max(0.35, 1 - reduction * effectiveness);
}
