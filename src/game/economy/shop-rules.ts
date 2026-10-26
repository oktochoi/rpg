import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { canSellItem, getItemDefinition } from '../inventory/item-definitions';
import { inventoryQuantity } from '../inventory/item-selectors';
import { shopAtLocation, SHOP_ID } from './shop-definitions';
import { getCombatUpgrade, isCombatUpgradeId } from './combat-upgrades';
import { isShopConsumable, shopItemIdsFor } from './shop-stock';
import { WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';

export function currentShopId(state: Readonly<GameState>): string | null {
  return shopAtLocation(state.world.currentLocationId)?.id ?? null;
}

export function eventsForBuyItem(state: Readonly<GameState>, itemId: string): GameEvent[] {
  const shopId = currentShopId(state) ?? SHOP_ID.LUEN_GENERAL_STORE;
  if (!shopItemIdsFor(state, shopId).includes(itemId)) {
    return [];
  }

  if (isCombatUpgradeId(itemId)) {
    const upgrade = getCombatUpgrade(itemId);
    if (!upgrade || !upgrade.shopListed) {
      return [];
    }
    if ((state.player.purchasedUpgradeIds ?? []).includes(itemId)) {
      return [];
    }
    if (state.player.gold < upgrade.buyPrice) {
      return [];
    }
    const sourceEventId = `shop:upgrade:${shopId}:${itemId}:${state.world.turn}:${state.player.gold}`;
    return [
      {
        type: 'PLAYER_GOLD_SPENT',
        amount: upgrade.buyPrice,
        reason: 'BUY',
        sourceEventId: `${sourceEventId}:gold`,
      },
      {
        type: 'COMBAT_UPGRADE_APPLIED',
        upgradeId: itemId,
        sourceEventId: `${sourceEventId}:upgrade`,
        mods: upgrade.mods,
      },
    ];
  }

  const definition = getItemDefinition(itemId);
  if (!definition) {
    return [];
  }
  if (!worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED) && !isShopConsumable(itemId)) {
    return [];
  }
  if (state.player.gold < definition.buyPrice) {
    return [];
  }
  const sourceEventId = `shop:buy:${shopId}:${itemId}:${state.world.turn}:${state.player.gold}`;
  return [
    {
      type: 'PLAYER_GOLD_SPENT',
      amount: definition.buyPrice,
      reason: 'BUY',
      sourceEventId: `${sourceEventId}:gold`,
    },
    {
      type: 'ITEM_PURCHASED',
      itemId,
      quantity: 1,
      price: definition.buyPrice,
      sourceEventId: `${sourceEventId}:item`,
    },
  ];
}

export function shopUnlocked(state: Readonly<GameState>): boolean {
  return worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED);
}

export function buyBlockedReason(state: Readonly<GameState>, itemId: string): string | null {
  const shopId = currentShopId(state);
  if (!shopId) {
    return '상점 안에서만 살 수 있다.';
  }
  if (!shopItemIdsFor(state, shopId).includes(itemId)) {
    return '여기서는 그 물건을 팔지 않는다.';
  }
  if (isCombatUpgradeId(itemId)) {
    const upgrade = getCombatUpgrade(itemId);
    if (!upgrade) {
      return '여기서는 그 물건을 팔지 않는다.';
    }
    if ((state.player.purchasedUpgradeIds ?? []).includes(itemId)) {
      return '이미 적용된 강화입니다.';
    }
    if (state.player.gold < upgrade.buyPrice) {
      return `골드가 부족하다. (${state.player.gold}G / ${upgrade.buyPrice}G)`;
    }
    return null;
  }
  const definition = getItemDefinition(itemId);
  if (!definition) {
    return '여기서는 그 물건을 팔지 않는다.';
  }
  if (!shopUnlocked(state) && !isShopConsumable(itemId)) {
    return '아직 장비를 들이기 전이다. 소모품은 살 수 있다.';
  }
  if (state.player.gold < definition.buyPrice) {
    return `골드가 부족하다. (${state.player.gold}G / ${definition.buyPrice}G)`;
  }
  return null;
}

export function sellBlockedReason(state: Readonly<GameState>, itemId: string, quantity = 1): string | null {
  if (!currentShopId(state)) {
    return '상점 안에서만 팔 수 있다.';
  }
  if (isCombatUpgradeId(itemId)) {
    return '그 물건은 팔 수 없다.';
  }
  if (!canSellItem(itemId)) {
    return '그 물건은 팔 수 없다.';
  }
  if (inventoryQuantity(state.player.inventory, itemId) < quantity) {
    return '그런 물건을 충분히 가지고 있지 않다.';
  }
  return null;
}

export function eventsForSellItem(state: Readonly<GameState>, itemId: string, quantity = 1): GameEvent[] {
  if (sellBlockedReason(state, itemId, quantity)) {
    return [];
  }
  const definition = getItemDefinition(itemId);
  if (!definition) {
    return [];
  }
  const amount = definition.sellPrice * quantity;
  const sourceEventId = `shop:sell:${itemId}:${state.world.turn}:${inventoryQuantity(state.player.inventory, itemId)}`;
  return [
    {
      type: 'ITEM_SOLD',
      itemId,
      quantity,
      price: amount,
      sourceEventId,
    },
    {
      type: 'PLAYER_GOLD_GAINED',
      amount,
      reason: 'SELL',
      sourceEventId: `${sourceEventId}:gold`,
    },
  ];
}
