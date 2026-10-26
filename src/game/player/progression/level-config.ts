export const LEVEL_CAP = 30;

export const EXP_TO_NEXT_LEVEL: readonly number[] = [
  0, 50, 80, 120, 160, 200, 240, 280, 330, 380, 440, 500, 560, 630, 700, 780, 860, 950, 1040, 1140, 1240, 1350, 1460,
  1580, 1700, 1830, 1960, 2100, 2240, 2390,
];

/** Permanent growth EXP — first clear / discovery / quest only. */
export const EXP_REWARD = {
  ENCOUNTER: 80,
  QUEST: 50,
  /** Fun Pass: mainline reaches Lv5 after Guardian without side grind. */
  BOSS: 180,
  DISCOVERY: 40,
  MILESTONE: 100,
  CHAPTER: 80,
  GUILD_RECOGNITION: 50,
} as const;

/**
 * Per-action EXP. Grindable actions are 0 — growth comes from first discovery / clear.
 * NEW_FACT / NEW_LOCATION / QUEST_PROGRESS remain the primary non-combat sources.
 */
export const ACTION_EXP: Readonly<Record<string, number>> = {
  TALK: 0,
  ASK: 0,
  MOVE: 0,
  INVESTIGATE: 0,
  HELP: 0,
  RESCUE: 0,
  GIVE: 0,
  BRIBE: 0,
  THREATEN: 0,
  USE_ITEM: 0,
  WAIT: 0,
  STORY_CHOICE: 0,
  QUEST_PROGRESS: 12,
  NEW_LOCATION: 20,
  NEW_FACT: 15,
  IMPORTANT_DISCOVERY: 40,
  ATTACK: 0,
  REST: 0,
  LEAVE: 0,
  USE_SKILL: 0,
  UNKNOWN: 0,
};

export const LEVEL_GROWTH = {
  adventurer: { hp: 5, mp: 4, attack: 2 },
  warrior: { hp: 8, mp: 2, attack: 3 },
  mage: { hp: 3, mp: 8, attack: 2 },
  rogue: { hp: 5, mp: 4, attack: 3 },
  wanderer: { hp: 5, mp: 4, attack: 2 },
} as const;

export function expRequiredForLevel(level: number): number {
  if (level < 1 || level >= LEVEL_CAP) {
    return 0;
  }
  return EXP_TO_NEXT_LEVEL[level] ?? 200;
}
