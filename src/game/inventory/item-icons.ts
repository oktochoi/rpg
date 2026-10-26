import { ITEM_ID } from './item-definitions';

const ICON = '/assets/ui/dark-fantasy';

const ITEM_ICON: Readonly<Record<string, string>> = {
  [ITEM_ID.HEALING_POTION]: `${ICON}/item_potion_hp.png`,
  [ITEM_ID.MANA_POTION]: `${ICON}/item_potion_mp.png`,
  [ITEM_ID.LINEN_BANDAGE]: `${ICON}/item_bandage.png`,
  [ITEM_ID.SIMPLE_RING]: `${ICON}/item_ring.png`,
  [ITEM_ID.OLD_COIN]: `${ICON}/item_coin.png`,
  [ITEM_ID.IRON_FRAGMENT]: `${ICON}/item_iron_fragment.png`,
  [ITEM_ID.RUINS_OLD_KEY]: `${ICON}/item_key.png`,
  [ITEM_ID.WORN_SWORD]: `${ICON}/item_sword.png`,
  [ITEM_ID.RUSTY_SWORD]: `${ICON}/item_sword.png`,
  [ITEM_ID.STURDY_SWORD]: `${ICON}/item_sword.png`,
  [ITEM_ID.IRON_SWORD]: `${ICON}/item_sword_iron.png`,
  [ITEM_ID.WOODEN_STAFF]: `${ICON}/item_sword.png`,
  [ITEM_ID.APPRENTICE_STAFF]: `${ICON}/item_sword.png`,
  [ITEM_ID.OLD_DAGGER]: `${ICON}/item_sword.png`,
  [ITEM_ID.STEEL_DAGGER]: `${ICON}/item_sword.png`,
  [ITEM_ID.TRAVELER_CLOTHES]: `${ICON}/item_armor.png`,
  [ITEM_ID.LEATHER_ARMOR]: `${ICON}/item_armor_leather.png`,
  [ITEM_ID.IRON_ARMOR]: `${ICON}/item_armor.png`,
  [ITEM_ID.APPRENTICE_ROBE]: `${ICON}/item_armor.png`,
  [ITEM_ID.SHADOW_LEATHER]: `${ICON}/item_armor_leather.png`,
  [ITEM_ID.GOBLIN_EAR]: `${ICON}/item_goblin_ear.png`,
};

export function itemIconPath(itemId: string): string | null {
  return ITEM_ICON[itemId] ?? null;
}
