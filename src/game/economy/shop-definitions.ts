import { getItemDefinition, ITEM_ID } from '../inventory/item-definitions';
import { LOCATION_ID } from '../world/locations/location-definitions';

export const SHOP_ID = {
  LUEN_GENERAL_STORE: 'luen_general_store',
} as const;

export const SHOPKEEPER_NPC_ID = 'shopkeeper_elin';

export interface ShopDefinition {
  id: string;
  name: string;
  locationId: string;
  npcId: string;
  itemIds: readonly string[];
}

export const SHOP_DEFINITIONS: Readonly<Record<string, ShopDefinition>> = {
  [SHOP_ID.LUEN_GENERAL_STORE]: {
    id: SHOP_ID.LUEN_GENERAL_STORE,
    name: '루엔 잡화점',
    locationId: LOCATION_ID.LUEN_GENERAL_STORE,
    npcId: SHOPKEEPER_NPC_ID,
    itemIds: [
      ITEM_ID.HEALING_POTION,
      ITEM_ID.MANA_POTION,
      ITEM_ID.IRON_SWORD,
      ITEM_ID.APPRENTICE_STAFF,
      ITEM_ID.STEEL_DAGGER,
      ITEM_ID.LEATHER_ARMOR,
      ITEM_ID.SIMPLE_RING,
    ],
  },
};

export function getShopDefinition(shopId: string): ShopDefinition | null {
  return SHOP_DEFINITIONS[shopId] ?? null;
}

export function shopAtLocation(locationId: string): ShopDefinition | null {
  return Object.values(SHOP_DEFINITIONS).find((shop) => shop.locationId === locationId) ?? null;
}

export function shopSellsItem(shopId: string, itemId: string): boolean {
  return getShopDefinition(shopId)?.itemIds.includes(itemId) === true;
}

export function shopPriceContext(shopId: string): string {
  const shop = getShopDefinition(shopId);
  if (!shop) {
    return '';
  }
  return shop.itemIds
    .map((itemId) => {
      const definition = getItemDefinition(itemId);
      if (!definition) {
        return null;
      }
      return `${definition.name}: 구매 ${definition.buyPrice}G / 판매 ${definition.sellPrice}G`;
    })
    .filter((line): line is string => Boolean(line))
    .join('\n');
}
