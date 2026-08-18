import { PLAYER_CLASS_ID, type PlayerClassId } from '../../player/classes/class-types';
import type { BasicAttackProfile } from './attack-types';

export const BASIC_ATTACKS: Readonly<Record<string, BasicAttackProfile>> = {
  warrior_slash: {
    id: 'warrior_slash',
    type: 'MELEE',
    damage: 28,
    cooldownMs: 420,
    durationMs: 220,
    knockbackScale: 1.45,
    hitbox: {
      width: 44,
      height: 48,
      offset: 32,
      activeStartMs: 70,
      activeEndMs: 160,
    },
  },
  mage_bolt: {
    id: 'mage_bolt',
    type: 'PROJECTILE',
    damage: 14,
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
      lifetimeMs: 720,
      radius: 5,
      color: 0x8ec4ff,
    },
  },
  rogue_stab: {
    id: 'rogue_stab',
    type: 'MELEE',
    damage: 16,
    cooldownMs: 220,
    durationMs: 140,
    knockbackScale: 0.55,
    hitbox: {
      width: 28,
      height: 30,
      offset: 22,
      activeStartMs: 30,
      activeEndMs: 90,
    },
  },
};

export function getBasicAttack(classId: PlayerClassId, basicAttackId: string): BasicAttackProfile {
  return BASIC_ATTACKS[basicAttackId] ?? (classId === PLAYER_CLASS_ID.MAGE ? BASIC_ATTACKS.mage_bolt : BASIC_ATTACKS.warrior_slash);
}
