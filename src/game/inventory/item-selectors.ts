import { EQUIPMENT_SLOT, getItemDefinition, ITEM_TYPE, type ItemDefinition } from './item-definitions';
import type { EquipmentState } from './equipment-types';
import { equippedItemId } from './equipment-types';
import type { InventoryItem } from '../player/player-state';

export type InventoryCategory = 'all' | 'equipment' | 'consumable' | 'other';

export function inventoryQuantity(inventory: readonly InventoryItem[], itemId: string): number {
  return inventory.find((item) => item.itemId === itemId)?.quantity ?? 0;
}

export function isEquipped(equipment: EquipmentState | undefined, itemId: string): boolean {
  if (!equipment) {
    return false;
  }
  return equipment.weapon === itemId || equipment.armor === itemId || equipment.accessory === itemId;
}

export function filterInventory(
  inventory: readonly InventoryItem[],
  category: InventoryCategory
): InventoryItem[] {
  return inventory.filter((item) => {
    if (item.quantity <= 0) {
      return false;
    }
    if (category === 'all') {
      return true;
    }
    const definition = getItemDefinition(item.itemId);
    if (!definition) {
      return category === 'other';
    }
    if (category === 'equipment') {
      return Boolean(definition.slot);
    }
    if (category === 'consumable') {
      return definition.type === ITEM_TYPE.CONSUMABLE;
    }
    return definition.type === ITEM_TYPE.MISC || definition.type === ITEM_TYPE.KEY_ITEM;
  });
}

export function compareEquipmentStats(currentId: string | null, next: ItemDefinition): { label: string; delta: number }[] {
  const current = currentId ? getItemDefinition(currentId) : null;
  const nextBonus = next.statBonuses ?? {};
  const currentBonus = current?.statBonuses ?? {};
  return [
    { label: 'Attack', delta: (nextBonus.attack ?? 0) - (currentBonus.attack ?? 0) },
    { label: 'HP', delta: (nextBonus.hp ?? 0) - (currentBonus.hp ?? 0) },
    { label: 'MP', delta: (nextBonus.mp ?? 0) - (currentBonus.mp ?? 0) },
  ].filter((row) => row.delta !== 0);
}

export function equippedName(
  equipment: EquipmentState | undefined,
  slot: keyof EquipmentState,
  enhancements: Readonly<Record<string, number>> = {}
): string {
  const itemId =
    slot === 'weapon'
      ? equippedItemId(equipment, EQUIPMENT_SLOT.WEAPON)
      : slot === 'armor'
        ? equippedItemId(equipment, EQUIPMENT_SLOT.ARMOR)
        : equippedItemId(equipment, EQUIPMENT_SLOT.ACCESSORY);
  if (!itemId) {
    return '없음';
  }
  return itemDisplayName(itemId, enhancements[itemId] ?? 0);
}

export function itemDisplayName(itemId: string, enhancementLevel = 0): string {
  const name = getItemDefinition(itemId)?.name ?? itemId;
  if (enhancementLevel > 0) {
    return `${name} +${enhancementLevel}`;
  }
  return name;
}
