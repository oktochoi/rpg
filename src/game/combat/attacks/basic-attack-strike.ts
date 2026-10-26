import { BASIC_ATTACKS } from './basic-attack-definitions';

/** Basic attacks only. Attack power does not change this. */
export const BASIC_CRIT_CHANCE = 0.05;

/** Applied to the already-calculated basic attack damage. */
export const BASIC_CRIT_MULTIPLIER = 1.5;

export interface BasicAttackStrike {
  damage: number;
  critical: boolean;
}

export function isBasicAttackId(skillId: string): boolean {
  return Object.prototype.hasOwnProperty.call(BASIC_ATTACKS, skillId);
}

/**
 * One swing, one roll. The result is not stored on the character.
 * `random` is in [0, 1). Values below {@link BASIC_CRIT_CHANCE} crit.
 */
export function rollBasicAttackStrike(normalDamage: number, random: number = Math.random()): BasicAttackStrike {
  const critical = random < BASIC_CRIT_CHANCE;
  const scaled = critical ? normalDamage * BASIC_CRIT_MULTIPLIER : normalDamage;
  return {
    critical,
    damage: Math.max(1, Math.round(scaled)),
  };
}

/** Floating number must be the HP actually removed, unless a respawn restored it. */
export function damageNumberForStrike(before: number | null, after: number | null, rolled: number): number {
  if (before === null || after === null || after >= before) {
    return rolled;
  }
  return before - after;
}

export function basicAttackDamageLabel(amount: number, critical: boolean): string {
  return critical ? `CRITICAL ${amount}` : `${amount}`;
}

export function readCombatHp(target: object): number | null {
  if (!('currentHp' in target)) {
    return null;
  }
  const value = target.currentHp;
  return typeof value === 'number' ? value : null;
}
