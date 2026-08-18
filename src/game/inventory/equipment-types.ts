import { EQUIPMENT_SLOT, type EquipmentSlot } from './item-definitions';

export interface EquipmentState {
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
}

export function emptyEquipment(): EquipmentState {
  return {
    weapon: null,
    armor: null,
    accessory: null,
  };
}

export function slotKey(slot: EquipmentSlot): keyof EquipmentState {
  if (slot === EQUIPMENT_SLOT.WEAPON) {
    return 'weapon';
  }
  if (slot === EQUIPMENT_SLOT.ARMOR) {
    return 'armor';
  }
  return 'accessory';
}

export function equippedItemId(equipment: EquipmentState | undefined, slot: EquipmentSlot): string | null {
  if (!equipment) {
    return null;
  }
  return equipment[slotKey(slot)] ?? null;
}
