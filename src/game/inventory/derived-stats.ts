import type { PlayerState } from '../player/player-state';
import { allocatedStatBonuses } from '../player/stats/stat-rules';
import { EQUIPMENT_SLOT } from './item-definitions';
import { getItemDefinition } from './item-definitions';
import type { EquipmentState } from './equipment-types';
import { equippedItemId } from './equipment-types';
import { ENHANCEMENT_BONUS } from './enhancement-config';

export interface DerivedPlayerStats {
  maxHp: number;
  maxMp: number;
  attackPower: number;
  attackBonus: number;
  hpBonus: number;
  mpBonus: number;
}

function enhancementBonus(itemId: string | null, slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY', level: number): { hp: number; mp: number; attack: number } {
  if (!itemId || level <= 0) {
    return { hp: 0, mp: 0, attack: 0 };
  }
  if (slot === 'WEAPON') {
    return { hp: 0, mp: 0, attack: ENHANCEMENT_BONUS.WEAPON_ATTACK * level };
  }
  if (slot === 'ARMOR') {
    return { hp: ENHANCEMENT_BONUS.ARMOR_HP * level, mp: 0, attack: 0 };
  }
  return { hp: 0, mp: 0, attack: 0 };
}

function bonusesFrom(itemId: string | null, slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY', enhancementLevel: number): { hp: number; mp: number; attack: number } {
  const definition = itemId ? getItemDefinition(itemId) : null;
  const extra = enhancementBonus(itemId, slot, enhancementLevel);
  return {
    hp: (definition?.statBonuses?.hp ?? 0) + extra.hp,
    mp: definition?.statBonuses?.mp ?? 0,
    attack: (definition?.statBonuses?.attack ?? 0) + extra.attack,
  };
}

export function equipmentBonuses(
  equipment: EquipmentState | undefined,
  enhancements: Readonly<Record<string, number>> = {}
): { hp: number; mp: number; attack: number } {
  const weaponId = equippedItemId(equipment, EQUIPMENT_SLOT.WEAPON);
  const armorId = equippedItemId(equipment, EQUIPMENT_SLOT.ARMOR);
  const accessoryId = equippedItemId(equipment, EQUIPMENT_SLOT.ACCESSORY);
  const weapon = bonusesFrom(weaponId, 'WEAPON', weaponId ? enhancements[weaponId] ?? 0 : 0);
  const armor = bonusesFrom(armorId, 'ARMOR', armorId ? enhancements[armorId] ?? 0 : 0);
  const accessory = bonusesFrom(accessoryId, 'ACCESSORY', accessoryId ? enhancements[accessoryId] ?? 0 : 0);
  return {
    hp: weapon.hp + armor.hp + accessory.hp,
    mp: weapon.mp + armor.mp + accessory.mp,
    attack: weapon.attack + armor.attack + accessory.attack,
  };
}

export function derivedPlayerStats(player: PlayerState): DerivedPlayerStats {
  const bonus = equipmentBonuses(player.equipment, player.equipmentEnhancements);
  const allocated = allocatedStatBonuses(player.allocatedStats);
  return {
    maxHp: player.maxHp + bonus.hp + allocated.maxHp,
    maxMp: player.maxMp + bonus.mp + allocated.maxMp,
    attackPower: (player.attackPower ?? 0) + bonus.attack + allocated.attack,
    attackBonus: bonus.attack + allocated.attack,
    hpBonus: bonus.hp + allocated.maxHp,
    mpBonus: bonus.mp + allocated.maxMp,
  };
}

export function clampResourceToDerived(player: PlayerState): { currentHp: number; currentMp: number } {
  const derived = derivedPlayerStats(player);
  return {
    currentHp: Math.max(0, Math.min(derived.maxHp, player.currentHp)),
    currentMp: Math.max(0, Math.min(derived.maxMp, player.currentMp)),
  };
}
