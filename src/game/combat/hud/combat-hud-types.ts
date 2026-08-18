import type { PlayerClassId } from '../../player/classes/class-types';
import type { CombatStatus } from '../combat-state';

export interface CombatHudSkillSlot {
  slot: 'Q' | 'E';
  skillId: string | null;
  name: string;
  key: string;
  currentCooldown: number;
  maxCooldown: number;
  mpCost: number;
  available: boolean;
  implemented: boolean;
  icon: string;
}

export interface CombatHudState {
  status: CombatStatus;
  player: {
    classId: PlayerClassId | string;
    className: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    dashCooldown: number;
    dashMaxCooldown: number;
    potionCount: number;
    potionCooldown: number;
    potionMaxCooldown: number;
    skills: CombatHudSkillSlot[];
  };
  boss?: {
    name: string;
    hp: number;
    maxHp: number;
    phase: 1 | 2;
  };
}

export const COMBAT_HUD_EVENT = 'combat-hud-snapshot';
