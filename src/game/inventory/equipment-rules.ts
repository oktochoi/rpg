import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { PLAYER_CLASS_ID, resolvePlayerClassId, type PlayerClassId } from '../player/classes';
import { playerHasItem } from '../player/player-state';
import { EQUIPMENT_SLOT, getItemDefinition, ITEM_ID, type EquipmentSlot } from './item-definitions';
import { emptyEquipment, slotKey } from './equipment-types';

function combatFamily(classId: string): PlayerClassId {
  return resolvePlayerClassId(classId);
}

export function canEquipItem(state: Readonly<GameState>, itemId: string): { allowed: boolean; reason?: string } {
  const definition = getItemDefinition(itemId);
  if (!definition?.slot) {
    return { allowed: false, reason: '장착할 수 없는 물건이다.' };
  }
  if (!playerHasItem(state.player, itemId) && equippedInSlot(state, definition.slot) !== itemId) {
    return { allowed: false, reason: '그런 물건을 가지고 있지 않다.' };
  }
  const allowed = definition.allowedCombatFamilies;
  if (allowed && allowed.length > 0 && !allowed.includes(combatFamily(state.player.classId))) {
    return { allowed: false, reason: '지금 직업으로는 이 장비를 쓸 수 없다.' };
  }
  return { allowed: true };
}

export function equippedInSlot(state: Readonly<GameState>, slot: EquipmentSlot): string | null {
  const equipment = state.player.equipment ?? emptyEquipment();
  return equipment[slotKey(slot)] ?? null;
}

export function eventsForEquipItem(state: Readonly<GameState>, itemId: string): GameEvent[] {
  const check = canEquipItem(state, itemId);
  if (!check.allowed) {
    return [];
  }
  const definition = getItemDefinition(itemId);
  if (!definition?.slot) {
    return [];
  }
  const previous = equippedInSlot(state, definition.slot);
  if (previous === itemId) {
    return [];
  }
  const events: GameEvent[] = [];
  if (previous) {
    events.push({ type: 'ITEM_UNEQUIPPED', itemId: previous, slot: definition.slot });
  }
  events.push({ type: 'ITEM_EQUIPPED', itemId, slot: definition.slot });
  return events;
}

export function eventsForUnequipSlot(state: Readonly<GameState>, slot: EquipmentSlot): GameEvent[] {
  const itemId = equippedInSlot(state, slot);
  if (!itemId) {
    return [];
  }
  return [{ type: 'ITEM_UNEQUIPPED', itemId, slot }];
}

export function starterWeaponForClass(classId: string): string {
  const family = combatFamily(classId);
  if (family === PLAYER_CLASS_ID.MAGE) {
    return ITEM_ID.APPRENTICE_STAFF;
  }
  if (family === PLAYER_CLASS_ID.ROGUE) {
    return ITEM_ID.STEEL_DAGGER;
  }
  return ITEM_ID.IRON_SWORD;
}

export function eventsForAdvancementStarter(state: Readonly<GameState>, classId: string): GameEvent[] {
  const sourceEventId = `reward:advancement:${classId}`;
  if ((state.processedRewardIds ?? []).includes(sourceEventId)) {
    return [];
  }
  const itemId = starterWeaponForClass(classId);
  const events: GameEvent[] = [
    { type: 'ITEM_OBTAINED', itemId, quantity: 1, sourceEventId },
    ...eventsForEquipItem(
      {
        ...state,
        player: {
          ...state.player,
          classId,
          inventory: state.player.inventory.some((item) => item.itemId === itemId)
            ? state.player.inventory
            : [...state.player.inventory, { itemId, quantity: 1 }],
        },
      },
      itemId
    ),
  ];
  return events;
}
