import type { SkillHudSlotView } from '../skills/SkillController';
import { getClassAppearance } from '../player/class-appearance';
import { resolvePlayerClassId } from '../../player/classes';
import { getSkillIconId } from '../visual/asset-registry';
import type { CombatStatus } from '../combat-state';
import type { CombatHudSkillSlot, CombatHudState } from './combat-hud-types';

export function toCombatHudSkills(
  slots: readonly SkillHudSlotView[],
  currentMp: number
): CombatHudSkillSlot[] {
  return slots.map((slot) => {
    const mpCost = slot.mpCost ?? 0;
    const maxCooldown = slot.maxCooldownMs ?? 0;
    const available = slot.implemented && slot.cooldownRemainingMs <= 0 && currentMp >= mpCost;
    return {
      slot: slot.slot,
      skillId: slot.skillId,
      name: slot.name,
      key: slot.slot,
      currentCooldown: slot.cooldownRemainingMs,
      maxCooldown,
      mpCost,
      available,
      implemented: slot.implemented,
      icon: slot.skillId ? getSkillIconId(slot.skillId) : 'slash',
    };
  });
}

export function buildCombatHudState(input: {
  status: CombatStatus;
  classId: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  dashCooldown: number;
  dashMaxCooldown: number;
  potionCount?: number;
  potionCooldown?: number;
  potionMaxCooldown?: number;
  skills: readonly SkillHudSlotView[];
  boss?: { name: string; hp: number; maxHp: number; phase: 1 | 2 };
}): CombatHudState {
  const classId = resolvePlayerClassId(input.classId);
  return {
    status: input.status,
    player: {
      classId,
      className: getClassAppearance(classId).label,
      hp: input.hp,
      maxHp: input.maxHp,
      mp: input.mp,
      maxMp: input.maxMp,
      dashCooldown: input.dashCooldown,
      dashMaxCooldown: input.dashMaxCooldown,
      potionCount: input.potionCount ?? 0,
      potionCooldown: input.potionCooldown ?? 0,
      potionMaxCooldown: input.potionMaxCooldown ?? 0,
      skills: toCombatHudSkills(input.skills, input.mp),
    },
    boss: input.boss,
  };
}
