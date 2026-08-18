import type { LocationId, PlayerId } from '../core/ids';
import type { EquipmentState } from '../inventory/equipment-types';
import { getItemDefinition } from '../inventory/item-definitions';

export type SkillUseContext = 'STORY' | 'COMBAT' | 'BOTH';

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export interface PlayerSkill {
  id: string;
  usableIn: SkillUseContext;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  locationId: LocationId;
  classId: string;
  classRankId?: string;
  level: number;
  exp: number;
  attackPower: number;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  gold: number;
  inventory: readonly InventoryItem[];
  equipment: EquipmentState;
  equipmentEnhancements: Readonly<Record<string, number>>;
  skills: readonly PlayerSkill[];
}

export function playerHasItem(player: PlayerState, itemId: string): boolean {
  return player.inventory.some((item) => item.itemId === itemId && item.quantity > 0);
}

export function withItemAdded(
  inventory: readonly InventoryItem[],
  itemId: string,
  quantity = 1
): InventoryItem[] {
  const add = Math.max(1, quantity);
  const maxStack = getItemDefinition(itemId)?.maxStack ?? 99;
  const existing = inventory.find((item) => item.itemId === itemId);
  if (!existing) {
    return [...inventory, { itemId, quantity: Math.min(maxStack, add) }];
  }
  return inventory.map((item) =>
    item.itemId === itemId ? { ...item, quantity: Math.min(maxStack, item.quantity + add) } : item
  );
}

export function withItemRemoved(
  inventory: readonly InventoryItem[],
  itemId: string,
  quantity = 1
): InventoryItem[] {
  return inventory.flatMap((item) => {
    if (item.itemId !== itemId) {
      return [item];
    }
    const next = item.quantity - Math.max(1, quantity);
    if (next <= 0) {
      return [];
    }
    return [{ ...item, quantity: next }];
  });
}

export function withItemConsumed(inventory: readonly InventoryItem[], itemId: string): InventoryItem[] {
  return inventory.flatMap((item) => {
    if (item.itemId !== itemId) {
      return [item];
    }
    if (item.quantity <= 1) {
      return [];
    }
    return [{ ...item, quantity: item.quantity - 1 }];
  });
}
