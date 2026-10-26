import { PLAYER_CLASS_ID, type PlayerClassId } from '../../player/classes/class-types';
import type { BasicAttackProfile } from './attack-types';

export const BASIC_ATTACKS: Readonly<Record<string, BasicAttackProfile>> = {
  warrior_slash: {
    id: 'warrior_slash',
    type: 'MELEE',
    damage: 34,
    cooldownMs: 420,
    durationMs: 240,
    knockbackScale: 1.45,
    hitbox: {
      width: 74,
      height: 58,
      offset: 58,
      activeStartMs: 70,
      activeEndMs: 180,
    },
  },
  mage_bolt: {
    id: 'mage_bolt',
    type: 'PROJECTILE',
    damage: 16,
    cooldownMs: 300,
    durationMs: 160,
    knockbackScale: 0.35,
    hitbox: {
      width: 12,
      height: 12,
      offset: 0,
      activeStartMs: 0,
      activeEndMs: 0,
    },
    projectile: {
      speed: 560,
      lifetimeMs: 860,
      radius: 11,
      color: 0x8ec4ff,
    },
  },
  rogue_stab: {
    id: 'rogue_stab',
    type: 'MELEE',
    damage: 18,
    cooldownMs: 220,
    durationMs: 150,
    knockbackScale: 0.55,
    hitbox: {
      width: 48,
      height: 40,
      offset: 42,
      activeStartMs: 30,
      activeEndMs: 100,
    },
  },
};

export function getBasicAttack(classId: PlayerClassId, basicAttackId: string): BasicAttackProfile {
  return BASIC_ATTACKS[basicAttackId] ?? (classId === PLAYER_CLASS_ID.MAGE ? BASIC_ATTACKS.mage_bolt : BASIC_ATTACKS.warrior_slash);
}
