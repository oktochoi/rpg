export const LEVEL_CAP = 30;

export const EXP_TO_NEXT_LEVEL: readonly number[] = [
  0, 50, 80, 120, 160, 200, 240, 280, 330, 380, 440, 500, 560, 630, 700, 780, 860, 950, 1040, 1140, 1240, 1350, 1460,
  1580, 1700, 1830, 1960, 2100, 2240, 2390,
];

export const EXP_REWARD = {
  ENCOUNTER: 40,
  QUEST: 50,
  BOSS: 120,
  DISCOVERY: 25,
  CHAPTER: 60,
  GUILD_RECOGNITION: 50,
} as const;

export const ACTION_EXP: Readonly<Record<string, number>> = {
  TALK: 5,
  ASK: 5,
  MOVE: 8,
  INVESTIGATE: 10,
  HELP: 12,
  RESCUE: 12,
  GIVE: 6,
  BRIBE: 7,
  THREATEN: 5,
  USE_ITEM: 3,
  WAIT: 1,
  STORY_CHOICE: 8,
  QUEST_PROGRESS: 15,
  NEW_LOCATION: 10,
  NEW_FACT: 12,
  IMPORTANT_DISCOVERY: 20,
  ATTACK: 0,
  REST: 0,
  LEAVE: 5,
  USE_SKILL: 3,
  UNKNOWN: 2,
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
