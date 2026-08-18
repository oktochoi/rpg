export const MAX_ENHANCEMENT_LEVEL = 3;

export const ENHANCEMENT_COST: readonly number[] = [25, 50, 90];

export const ENHANCEMENT_BONUS = {
  WEAPON_ATTACK: 2,
  ARMOR_HP: 10,
} as const;

export const ENHANCEMENT_TIME_MINUTES = 8;

export function enhancementCostFor(currentLevel: number): number {
  if (currentLevel < 0 || currentLevel >= MAX_ENHANCEMENT_LEVEL) {
    return 0;
  }
  return ENHANCEMENT_COST[currentLevel] ?? 0;
}

export function isEnhanceableSlot(slot: string | undefined): boolean {
  return slot === 'WEAPON' || slot === 'ARMOR';
}
