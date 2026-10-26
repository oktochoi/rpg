import type { RewardBundle } from './economy-types';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { ITEM_ID } from '../inventory/item-definitions';
import { QUEST_ID } from '../quests/quest-definitions';

export interface EncounterRewardTiers {
  firstClear: RewardBundle;
  repeatClear: RewardBundle;
}

/**
 * First clear: permanent growth (EXP granted separately) + meaningful gold.
 * Repeat: gold drip only — no items / no major loot.
 */
export const ENCOUNTER_REWARD_TIERS: Readonly<Record<string, EncounterRewardTiers>> = {
  [ENCOUNTER_ID.RUINS_EASY_01]: {
    firstClear: { gold: 12, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 8 },
  },
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: {
    firstClear: { gold: 100, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 20 },
  },
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: {
    firstClear: { gold: 180, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 25 },
  },
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: {
    firstClear: { gold: 120, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 22 },
  },
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: {
    firstClear: { gold: 140, items: [{ itemId: ITEM_ID.IRON_FRAGMENT, quantity: 1 }] },
    repeatClear: { gold: 28 },
  },
  [ENCOUNTER_ID.CH1_FOREST_DEEP]: {
    firstClear: { gold: 150, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 26 },
  },
  [ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER]: {
    firstClear: { gold: 160, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 28 },
  },
  [ENCOUNTER_ID.CH1_RUINS_GATE]: {
    firstClear: { gold: 160, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 30 },
  },
  [ENCOUNTER_ID.RUINS_ARCHER_01]: {
    firstClear: { gold: 18 },
    repeatClear: { gold: 10 },
  },
  [ENCOUNTER_ID.RUINS_BRUTE_01]: {
    firstClear: { gold: 30 },
    repeatClear: { gold: 12 },
  },
  [ENCOUNTER_ID.RUINS_MIXED_01]: {
    firstClear: { gold: 160, items: [{ itemId: ITEM_ID.GOBLIN_EAR, quantity: 1 }] },
    repeatClear: { gold: 30 },
  },
  [ENCOUNTER_ID.RUINS_HEAVY_01]: {
    firstClear: { gold: 40 },
    repeatClear: { gold: 15 },
  },
  [ENCOUNTER_ID.RUINS_BOSS_01]: {
    firstClear: { gold: 220 },
    repeatClear: { gold: 40 },
  },
};

/** @deprecated Prefer encounterRewardTiersFor — kept for callers expecting a flat bundle. */
export const ENCOUNTER_REWARDS: Readonly<Record<string, RewardBundle>> = Object.fromEntries(
  Object.entries(ENCOUNTER_REWARD_TIERS).map(([id, tiers]) => [id, tiers.firstClear])
);

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

export function encounterRewardTiersFor(combatId: string): EncounterRewardTiers {
  return (
    ENCOUNTER_REWARD_TIERS[combatId] ?? {
      firstClear: {},
      repeatClear: { gold: 10 },
    }
  );
}

export function encounterRewardFor(combatId: string, firstClear = true): RewardBundle {
  const tiers = encounterRewardTiersFor(combatId);
  return firstClear ? tiers.firstClear : tiers.repeatClear;
}
