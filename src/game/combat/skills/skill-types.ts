import type { PlayerClassId, SkillSlot } from '../../player/classes/class-types';

export type { SkillSlot };

export type SkillType = 'MELEE' | 'PROJECTILE' | 'DASH' | 'AOE' | 'DEFENSE';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  classId: PlayerClassId;
  slot: SkillSlot;
  cooldownMs: number;
  mpCost: number;
  type: SkillType;
  implemented: boolean;
  damage?: number;
  backDamage?: number;
  range?: number;
  durationMs?: number;
  projectileSpeed?: number;
  damageReduction?: number;
  slowDurationMs?: number;
  slowMultiplier?: number;
}

export interface SkillRuntimeState {
  skillId: string;
  cooldownRemainingMs: number;
  isActive: boolean;
}

export type SkillUseResult =
  | { ok: true; skillId: string }
  | { ok: false; reason: 'DEAD' | 'LOCKED' | 'COOLDOWN' | 'MP' | 'NOT_IMPLEMENTED' | 'NO_SKILL' };

export interface SkillExecutionContext {
  playerX: number;
  playerY: number;
  pointerX: number;
  pointerY: number;
  skill: SkillDefinition;
}

export interface SkillExecutorResult {
  ok: boolean;
  reason?: 'NOT_IMPLEMENTED';
}
