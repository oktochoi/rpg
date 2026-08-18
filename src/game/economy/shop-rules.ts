import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { canSellItem, getItemDefinition } from '../inventory/item-definitions';
import { inventoryQuantity } from '../inventory/item-selectors';
import { shopAtLocation, shopSellsItem, SHOP_ID } from './shop-definitions';
import { WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';

export function currentShopId(state: Readonly<GameState>): string | null {
  return shopAtLocation(state.world.currentLocationId)?.id ?? null;
}

export function eventsForBuyItem(state: Readonly<GameState>, itemId: string): GameEvent[] {
  const shopId = currentShopId(state) ?? SHOP_ID.LUEN_GENERAL_STORE;
  const definition = getItemDefinition(itemId);
  if (!definition || !shopSellsItem(shopId, itemId)) {
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
  if (!shopUnlocked(state)) {
    return '아직 상점을 이용할 때가 아니다.';
  }
  const shopId = currentShopId(state);
  if (!shopId) {
    return '상점 안에서만 살 수 있다.';
  }
  const definition = getItemDefinition(itemId);
  if (!definition || !shopSellsItem(shopId, itemId)) {
    return '여기서는 그 물건을 팔지 않는다.';
  }
  if (state.player.gold < definition.buyPrice) {
    return '골드가 부족하다.';
  }
  return null;
}

export function sellBlockedReason(state: Readonly<GameState>, itemId: string, quantity = 1): string | null {
  if (!shopUnlocked(state)) {
    return '아직 상점을 이용할 때가 아니다.';
  }
  if (!currentShopId(state)) {
    return '상점 안에서만 팔 수 있다.';
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
