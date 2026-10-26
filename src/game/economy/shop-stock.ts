import type { GameState } from '../core/game-state';
import { getItemDefinition, ITEM_ID } from '../inventory/item-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { getCombatUpgrade, shopListedUpgradeIds } from './combat-upgrades';
import { SHOP_DEFINITIONS, SHOP_ID } from './shop-definitions';

export const SHOP_STOCK_PHASE = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const;

export type ShopStockPhase = (typeof SHOP_STOCK_PHASE)[keyof typeof SHOP_STOCK_PHASE];

const CONSUMABLES = [ITEM_ID.LINEN_BANDAGE, ITEM_ID.HEALING_POTION, ITEM_ID.MANA_POTION] as const;
const PHASE_A = [...CONSUMABLES, ITEM_ID.STURDY_SWORD];
const PHASE_B = [...PHASE_A, ITEM_ID.SIMPLE_RING, ITEM_ID.LEATHER_ARMOR, ITEM_ID.IRON_SWORD];
const PHASE_C = [...PHASE_B, ITEM_ID.APPRENTICE_STAFF, ITEM_ID.STEEL_DAGGER];

export function shopStockPhase(state: Readonly<GameState>): ShopStockPhase {
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY]?.status;
  if (
    worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED) ||
    ruins === QUEST_STATUS.ACTIVE ||
    ruins === QUEST_STATUS.COMPLETED
  ) {
    return SHOP_STOCK_PHASE.C;
  }
  if (worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED) || worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED)) {
    return SHOP_STOCK_PHASE.B;
  }
  return SHOP_STOCK_PHASE.A;
}

export function shopItemIdsFor(state: Readonly<GameState>, shopId: string = SHOP_ID.LUEN_GENERAL_STORE): readonly string[] {
  if (shopId !== SHOP_ID.LUEN_GENERAL_STORE) {
    return SHOP_DEFINITIONS[shopId]?.itemIds ?? [];
  }
  const phase = shopStockPhase(state);
  const base =
    phase === SHOP_STOCK_PHASE.C ? PHASE_C : phase === SHOP_STOCK_PHASE.B ? PHASE_B : PHASE_A;
  // Permanent combat upgrades unlock by story progress (see combat-upgrades unlock).
  const upgrades = phase === SHOP_STOCK_PHASE.A ? [] : shopListedUpgradeIds(state);
  return [...upgrades, ...base];
}

export function isShopConsumable(itemId: string): boolean {
  return (CONSUMABLES as readonly string[]).includes(itemId);
}

export function affordableShopItemIds(state: Readonly<GameState>): string[] {
  return shopItemIdsFor(state).filter((itemId) => {
    const definition = getItemDefinition(itemId);
    if (definition) {
      return state.player.gold >= definition.buyPrice;
    }
    const upgrade = getCombatUpgrade(itemId);
    return Boolean(upgrade && state.player.gold >= upgrade.buyPrice);
  });
}
