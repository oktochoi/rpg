import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { ITEM_ID } from '../inventory/item-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import type { RewardBundle } from './economy-types';

export const ENCOUNTER_REWARDS: Readonly<Record<string, RewardBundle>> = {
  [ENCOUNTER_ID.RUINS_EASY_01]: {
    gold: 12,
    items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }],
  },
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: {
    gold: 18,
    items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }],
  },
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: {
    gold: 18,
    items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }],
  },
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: {
    gold: 22,
    items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }],
  },
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: {
    gold: 28,
    items: [{ itemId: ITEM_ID.IRON_FRAGMENT, quantity: 1 }],
  },
  [ENCOUNTER_ID.CH1_RUINS_GATE]: {
    gold: 36,
    items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }],
  },
  [ENCOUNTER_ID.RUINS_ARCHER_01]: {
    gold: 18,
  },
  [ENCOUNTER_ID.RUINS_BRUTE_01]: {
    gold: 30,
  },
  [ENCOUNTER_ID.RUINS_MIXED_01]: {
    gold: 32,
    items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }],
  },
  [ENCOUNTER_ID.RUINS_HEAVY_01]: {
    gold: 40,
  },
  [ENCOUNTER_ID.RUINS_BOSS_01]: {
    gold: 100,
  },
};

export const QUEST_REWARD_FALLBACK: Readonly<Record<string, RewardBundle>> = {
  [QUEST_ID.FOREST_GOBLIN_SCOUR]: {
    gold: 30,
  },
  [QUEST_ID.RUINS_MYSTERY]: {
    gold: 70,
    items: [{ itemId: ITEM_ID.HEALING_POTION, quantity: 2 }],
  },
  [QUEST_ID.MARTA_LOST_PARCEL]: {
    gold: 25,
    items: [{ itemId: ITEM_ID.HEALING_POTION, quantity: 1 }],
  },
  [QUEST_ID.LEON_GOBLIN_WATCH]: {
    gold: 50,
  },
  [QUEST_ID.KNIGHT_SUSPICION]: {
    gold: 20,
  },
};

export function encounterRewardFor(combatId: string): RewardBundle {
  return ENCOUNTER_REWARDS[combatId] ?? {};
}
