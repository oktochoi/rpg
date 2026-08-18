export const BOSS_ID = {
  RUINS_GUARDIAN: 'RUINS_GUARDIAN',
} as const;

export type BossId = (typeof BOSS_ID)[keyof typeof BOSS_ID];

export const BOSS_INSTANCE_ID = {
  RUINS_GUARDIAN: 'ruins_guardian_001',
} as const;

export const BOSS_PATTERN_ID = {
  HEAVY_SLAM: 'heavy_slam',
  PROJECTILE_BURST: 'projectile_burst',
  CHARGE: 'charge',
} as const;

export type BossPatternId = (typeof BOSS_PATTERN_ID)[keyof typeof BOSS_PATTERN_ID];

export const BOSS_STATE = {
  IDLE: 'IDLE',
  WINDUP: 'WINDUP',
  ATTACKING: 'ATTACKING',
  RECOVERY: 'RECOVERY',
  PHASE_TRANSITION: 'PHASE_TRANSITION',
  DEAD: 'DEAD',
} as const;

export type BossState = (typeof BOSS_STATE)[keyof typeof BOSS_STATE];

export interface BossPhaseDefinition {
  id: 1 | 2;
  hpThreshold: number;
  patternDelayMs: number;
  patternCycle: readonly BossPatternId[];
}

export interface BossDefinition {
  id: BossId;
  name: string;
  maxHp: number;
  moveSpeed: number;
  damage: number;
  size: number;
  color: number;
  arenaId: string;
  tags: readonly string[];
  patternIds: readonly BossPatternId[];
  phaseDefinitions: readonly BossPhaseDefinition[];
  statusResistance: {
    slowEffectiveness: number;
  };
}

export interface BossRuntimeState {
  instanceId: string;
  bossId: BossId;
  currentHp: number;
  currentPhase: 1 | 2;
  currentPatternId?: BossPatternId;
  lastPatternId?: BossPatternId;
  isDead: boolean;
  isAttacking: boolean;
  isTransitioningPhase: boolean;
  patternCooldownRemainingMs: number;
  phaseTransitionTriggered: boolean;
  state: BossState;
}

export interface BossDebugSnapshot {
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  state: BossState;
  patternId?: BossPatternId;
  nextPatternId?: BossPatternId;
  cooldownMs: number;
}

export interface HeavySlamConfig {
  damage: number;
  windUpMs: number;
  activeMs: number;
  recoveryMs: number;
  range: number;
  width: number;
  phase2WindUpMs: number;
}

export interface ProjectileBurstConfig {
  damage: number;
  count: number;
  phase2Count: number;
  spreadDeg: number;
  anglesPhase1: readonly number[];
  anglesPhase2: readonly number[];
  speed: number;
  lifetimeMs: number;
  radius: number;
  windUpMs: number;
  recoveryMs: number;
}

export interface ChargeConfig {
  damage: number;
  windUpMs: number;
  speed: number;
  phase2Speed: number;
  durationMs: number;
  recoveryMs: number;
  knockbackScale: number;
}

export interface RuinsGuardianConfig {
  phaseThreshold: number;
  phaseTransitionMs: number;
  phase1DelayMs: number;
  phase2DelayMs: number;
  slowEffectiveness: number;
  knockbackScale: number;
  heavySlam: HeavySlamConfig;
  projectileBurst: ProjectileBurstConfig;
  charge: ChargeConfig;
}

export interface BossProjectileShot {
  originX: number;
  originY: number;
  dirX: number;
  dirY: number;
  speed: number;
  damage: number;
  lifetimeMs: number;
  radius: number;
  sourceId?: string;
}
