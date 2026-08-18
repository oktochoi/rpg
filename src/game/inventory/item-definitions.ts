import { PLAYER_CLASS_ID, type PlayerClassId } from '../player/classes/class-types';

export const ITEM_TYPE = {
  CONSUMABLE: 'CONSUMABLE',
  WEAPON: 'WEAPON',
  ARMOR: 'ARMOR',
  ACCESSORY: 'ACCESSORY',
  KEY_ITEM: 'KEY_ITEM',
  MISC: 'MISC',
} as const;

export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];

export const EQUIPMENT_SLOT = {
  WEAPON: 'WEAPON',
  ARMOR: 'ARMOR',
  ACCESSORY: 'ACCESSORY',
} as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOT)[keyof typeof EQUIPMENT_SLOT];

export interface ItemStatBonuses {
  hp?: number;
  mp?: number;
  attack?: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  buyPrice: number;
  sellPrice: number;
  maxStack: number;
  healHp?: number;
  healMp?: number;
  slot?: EquipmentSlot;
  allowedCombatFamilies?: readonly PlayerClassId[];
  statBonuses?: ItemStatBonuses;
}

export const ITEM_ID = {
  HEALING_POTION: 'healing_potion',
  MANA_POTION: 'mana_potion',
  LINEN_BANDAGE: 'linen_bandage',
  WORN_SWORD: 'worn_sword',
  RUSTY_SWORD: 'rusty_sword',
  STURDY_SWORD: 'sturdy_sword',
  IRON_SWORD: 'iron_sword',
  WOODEN_STAFF: 'wooden_staff',
  APPRENTICE_STAFF: 'apprentice_staff',
  OLD_DAGGER: 'old_dagger',
  STEEL_DAGGER: 'steel_dagger',
  TRAVELER_CLOTHES: 'traveler_clothes',
  LEATHER_ARMOR: 'leather_armor',
  IRON_ARMOR: 'iron_armor',
  APPRENTICE_ROBE: 'apprentice_robe',
  SHADOW_LEATHER: 'shadow_leather',
  SIMPLE_RING: 'simple_ring',
  GOBLIN_EAR: 'goblin_ear',
  IRON_FRAGMENT: 'iron_fragment',
  OLD_COIN: 'old_coin',
} as const;

const ALL_FAMILIES: readonly PlayerClassId[] = [
  PLAYER_CLASS_ID.ADVENTURER,
  PLAYER_CLASS_ID.WARRIOR,
  PLAYER_CLASS_ID.MAGE,
  PLAYER_CLASS_ID.ROGUE,
];

function item(definition: ItemDefinition): ItemDefinition {
  return definition;
}

export const ITEM_DEFINITIONS: Readonly<Record<string, ItemDefinition>> = {
  [ITEM_ID.HEALING_POTION]: item({
    id: ITEM_ID.HEALING_POTION,
    name: '회복 물약',
    description: '마시면 체력을 30 회복한다.',
    type: ITEM_TYPE.CONSUMABLE,
    buyPrice: 18,
    sellPrice: 8,
    maxStack: 20,
    healHp: 30,
  }),
  [ITEM_ID.MANA_POTION]: item({
    id: ITEM_ID.MANA_POTION,
    name: '마나 물약',
    description: '마시면 마나를 25 회복한다.',
    type: ITEM_TYPE.CONSUMABLE,
    buyPrice: 22,
    sellPrice: 10,
    maxStack: 20,
    healMp: 25,
  }),
  [ITEM_ID.LINEN_BANDAGE]: item({
    id: ITEM_ID.LINEN_BANDAGE,
    name: '린넨 붕대',
    description: '상처를 감으면 체력을 조금 회복한다.',
    type: ITEM_TYPE.CONSUMABLE,
    buyPrice: 12,
    sellPrice: 4,
    maxStack: 20,
    healHp: 15,
  }),
  [ITEM_ID.WORN_SWORD]: item({
    id: ITEM_ID.WORN_SWORD,
    name: '낡은 검',
    description: '신입 모험가가 흔히 쥐는 가벼운 검.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 0,
    sellPrice: 8,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.WARRIOR],
    statBonuses: { attack: 2 },
  }),
  [ITEM_ID.RUSTY_SWORD]: item({
    id: ITEM_ID.RUSTY_SWORD,
    name: '녹슨 검',
    description: '날이 무뎌진 연습용 검.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 40,
    sellPrice: 12,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.WARRIOR],
    statBonuses: { attack: 3 },
  }),
  [ITEM_ID.STURDY_SWORD]: item({
    id: ITEM_ID.STURDY_SWORD,
    name: '튼튼한 검',
    description: '신참이 쓰기에도 무리가 없는 단단한 검.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 45,
    sellPrice: 16,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.WARRIOR],
    statBonuses: { attack: 4 },
  }),
  [ITEM_ID.IRON_SWORD]: item({
    id: ITEM_ID.IRON_SWORD,
    name: '철제 검',
    description: '균형 잡힌 철검. 검사의 손에 잘 맞는다.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 95,
    sellPrice: 36,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.WARRIOR],
    statBonuses: { attack: 6 },
  }),
  [ITEM_ID.WOODEN_STAFF]: item({
    id: ITEM_ID.WOODEN_STAFF,
    name: '나무 지팡이',
    description: '마력을 조금 담을 수 있는 연습용 지팡이.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 40,
    sellPrice: 12,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.MAGE],
    statBonuses: { attack: 2, mp: 5 },
  }),
  [ITEM_ID.APPRENTICE_STAFF]: item({
    id: ITEM_ID.APPRENTICE_STAFF,
    name: '초급 마법 지팡이',
    description: '초급 마법사가 쓰는 지팡이.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 110,
    sellPrice: 40,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.MAGE],
    statBonuses: { attack: 5, mp: 10 },
  }),
  [ITEM_ID.OLD_DAGGER]: item({
    id: ITEM_ID.OLD_DAGGER,
    name: '낡은 단검',
    description: '짧고 가벼운 단검.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 40,
    sellPrice: 12,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.ROGUE],
    statBonuses: { attack: 2 },
  }),
  [ITEM_ID.STEEL_DAGGER]: item({
    id: ITEM_ID.STEEL_DAGGER,
    name: '강철 단검',
    description: '날이 선 단검. 기습에 적합하다.',
    type: ITEM_TYPE.WEAPON,
    buyPrice: 110,
    sellPrice: 40,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.WEAPON,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.ROGUE],
    statBonuses: { attack: 5 },
  }),
  [ITEM_ID.TRAVELER_CLOTHES]: item({
    id: ITEM_ID.TRAVELER_CLOTHES,
    name: '여행자 옷',
    description: '길을 걷는 사람에게 흔한 여행복.',
    type: ITEM_TYPE.ARMOR,
    buyPrice: 0,
    sellPrice: 6,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.ARMOR,
    allowedCombatFamilies: ALL_FAMILIES,
    statBonuses: {},
  }),
  [ITEM_ID.LEATHER_ARMOR]: item({
    id: ITEM_ID.LEATHER_ARMOR,
    name: '가죽 갑옷',
    description: '가벼운 가죽 방어구.',
    type: ITEM_TYPE.ARMOR,
    buyPrice: 70,
    sellPrice: 26,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.ARMOR,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ADVENTURER, PLAYER_CLASS_ID.WARRIOR, PLAYER_CLASS_ID.ROGUE],
    statBonuses: { hp: 20 },
  }),
  [ITEM_ID.IRON_ARMOR]: item({
    id: ITEM_ID.IRON_ARMOR,
    name: '철제 갑옷',
    description: '묵직한 철 갑옷. 검사에게 어울린다.',
    type: ITEM_TYPE.ARMOR,
    buyPrice: 140,
    sellPrice: 50,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.ARMOR,
    allowedCombatFamilies: [PLAYER_CLASS_ID.WARRIOR],
    statBonuses: { hp: 14 },
  }),
  [ITEM_ID.APPRENTICE_ROBE]: item({
    id: ITEM_ID.APPRENTICE_ROBE,
    name: '견습 로브',
    description: '마력을 해치지 않는 얇은 로브.',
    type: ITEM_TYPE.ARMOR,
    buyPrice: 80,
    sellPrice: 30,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.ARMOR,
    allowedCombatFamilies: [PLAYER_CLASS_ID.MAGE],
    statBonuses: { mp: 12, hp: 4 },
  }),
  [ITEM_ID.SHADOW_LEATHER]: item({
    id: ITEM_ID.SHADOW_LEATHER,
    name: '그림자 가죽',
    description: '움직임이 편한 어두운 가죽옷.',
    type: ITEM_TYPE.ARMOR,
    buyPrice: 80,
    sellPrice: 30,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.ARMOR,
    allowedCombatFamilies: [PLAYER_CLASS_ID.ROGUE],
    statBonuses: { hp: 6, attack: 1 },
  }),
  [ITEM_ID.SIMPLE_RING]: item({
    id: ITEM_ID.SIMPLE_RING,
    name: '간단한 반지',
    description: '작은 마법이 깃든 반지.',
    type: ITEM_TYPE.ACCESSORY,
    buyPrice: 50,
    sellPrice: 20,
    maxStack: 1,
    slot: EQUIPMENT_SLOT.ACCESSORY,
    allowedCombatFamilies: ALL_FAMILIES,
    statBonuses: { hp: 10 },
  }),
  [ITEM_ID.GOBLIN_EAR]: item({
    id: ITEM_ID.GOBLIN_EAR,
    name: '고블린 귀',
    description: '잡화점에서 팔 수 있는 전리품.',
    type: ITEM_TYPE.MISC,
    buyPrice: 0,
    sellPrice: 5,
    maxStack: 20,
  }),
  [ITEM_ID.IRON_FRAGMENT]: item({
    id: ITEM_ID.IRON_FRAGMENT,
    name: '쇠조각',
    description: '고블린 야영지에서 주운 녹슨 쇠조각. 팔면 조금의 골드가 된다.',
    type: ITEM_TYPE.MISC,
    buyPrice: 0,
    sellPrice: 8,
    maxStack: 20,
  }),
  [ITEM_ID.OLD_COIN]: item({
    id: ITEM_ID.OLD_COIN,
    name: '낡은 동전',
    description: '어디서 흘린 것인지 모를 낡은 동전.',
    type: ITEM_TYPE.MISC,
    buyPrice: 0,
    sellPrice: 3,
    maxStack: 50,
  }),
};

export function getItemDefinition(itemId: string): ItemDefinition | null {
  return ITEM_DEFINITIONS[itemId] ?? null;
}

export function isEquipmentItem(itemId: string): boolean {
  const definition = getItemDefinition(itemId);
  return Boolean(definition?.slot);
}

export function isKeyItem(itemId: string): boolean {
  return getItemDefinition(itemId)?.type === ITEM_TYPE.KEY_ITEM;
}

export function canSellItem(itemId: string): boolean {
  const definition = getItemDefinition(itemId);
  if (!definition || definition.type === ITEM_TYPE.KEY_ITEM) {
    return false;
  }
  return definition.sellPrice > 0;
}
