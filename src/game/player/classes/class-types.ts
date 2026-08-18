export const PLAYER_CLASS_ID = {
  ADVENTURER: 'adventurer',
  WARRIOR: 'warrior',
  MAGE: 'mage',
  ROGUE: 'rogue',
} as const;

export const COMBAT_FAMILY_ID = {
  ADVENTURER: 'adventurer',
  WARRIOR: 'warrior',
  MAGE: 'mage',
  ROGUE: 'rogue',
} as const;

export type CombatFamilyId = (typeof COMBAT_FAMILY_ID)[keyof typeof COMBAT_FAMILY_ID];

export type PlayerClassId = (typeof PLAYER_CLASS_ID)[keyof typeof PLAYER_CLASS_ID];

export type SkillSlot = 'Q' | 'E';

export type DashStyle = 'dash' | 'blink';

export interface DashProfile {
  id: string;
  speed: number;
  durationMs: number;
  cooldownMs: number;
  invincibleMs: number;
  style: DashStyle;
}

export interface PlayerClassDefinition {
  id: PlayerClassId;
  name: string;
  description: string;
  playStyle: string;
  baseStats: {
    maxHp: number;
    maxMp: number;
    moveSpeed: number;
    attackPower: number;
  };
  combat: {
    basicAttackId: string;
    dashProfileId: string;
    skillIds: readonly string[];
  };
}
