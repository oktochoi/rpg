import { ARENA_ID } from '../arenas/arena-types';
import {
  BOSS_ID,
  BOSS_PATTERN_ID,
  type BossDefinition,
  type BossId,
  type BossRuntimeState,
} from './boss-types';
import { RUINS_GUARDIAN_CONFIG } from './boss-config';

export const BOSS_DEFINITIONS: Record<BossId, BossDefinition> = {
  [BOSS_ID.RUINS_GUARDIAN]: {
    id: BOSS_ID.RUINS_GUARDIAN,
    name: '고대 수호자',
    maxHp: 2000,
    moveSpeed: 88,
    damage: 28,
    size: 64,
    color: 0x6b4c9a,
    arenaId: ARENA_ID.RUINS_GUARDIAN,
    tags: ['boss', 'ruins', 'guardian'],
    patternIds: [BOSS_PATTERN_ID.HEAVY_SLAM, BOSS_PATTERN_ID.PROJECTILE_BURST, BOSS_PATTERN_ID.CHARGE],
    statusResistance: {
      slowEffectiveness: RUINS_GUARDIAN_CONFIG.slowEffectiveness,
    },
    phaseDefinitions: [
      {
        id: 1,
        hpThreshold: 1,
        patternDelayMs: RUINS_GUARDIAN_CONFIG.phase1DelayMs,
        patternCycle: [
          BOSS_PATTERN_ID.HEAVY_SLAM,
          BOSS_PATTERN_ID.PROJECTILE_BURST,
          BOSS_PATTERN_ID.HEAVY_SLAM,
          BOSS_PATTERN_ID.CHARGE,
        ],
      },
      {
        id: 2,
        hpThreshold: RUINS_GUARDIAN_CONFIG.phaseThreshold,
        patternDelayMs: RUINS_GUARDIAN_CONFIG.phase2DelayMs,
        patternCycle: [
          BOSS_PATTERN_ID.PROJECTILE_BURST,
          BOSS_PATTERN_ID.CHARGE,
          BOSS_PATTERN_ID.HEAVY_SLAM,
          BOSS_PATTERN_ID.PROJECTILE_BURST,
        ],
      },
    ],
  },
};

export function getBossDefinition(bossId: string): BossDefinition | null {
  return BOSS_DEFINITIONS[bossId as BossId] ?? null;
}

export function createBossRuntime(definition: BossDefinition, instanceId = `${definition.id.toLowerCase()}_001`): BossRuntimeState {
  return {
    instanceId,
    bossId: definition.id,
    currentHp: definition.maxHp,
    currentPhase: 1,
    currentPatternId: undefined,
    isAttacking: false,
    isDead: false,
    isTransitioningPhase: false,
    patternCooldownRemainingMs: definition.phaseDefinitions[0]?.patternDelayMs ?? 1100,
    lastPatternId: undefined,
    phaseTransitionTriggered: false,
    state: 'IDLE',
  };
}

export function shouldTriggerPhase2(runtime: BossRuntimeState, maxHp: number, threshold = RUINS_GUARDIAN_CONFIG.phaseThreshold): boolean {
  if (runtime.isDead || runtime.phaseTransitionTriggered || runtime.currentPhase === 2) {
    return false;
  }
  if (maxHp <= 0) {
    return false;
  }
  return runtime.currentHp / maxHp <= threshold;
}
