import type { PermanentCombatMods } from '../player/player-state';
import type { GameState } from '../core/game-state';
import { CHAPTER_FACT_ID } from '../knowledge/chapter-1-facts';
import { doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';

export const COMBAT_UPGRADE_ID = {
  BLADE_EDGE: 'upgrade_blade_edge',
  LONG_BLADE: 'upgrade_long_blade',
  ARMOR_PLATING: 'upgrade_armor_plating',
  GUARDIAN_CORE: 'upgrade_guardian_core',
} as const;

export type CombatUpgradeId = (typeof COMBAT_UPGRADE_ID)[keyof typeof COMBAT_UPGRADE_ID];

export type UpgradeUnlock =
  | { type: 'ALWAYS' }
  | { type: 'WORLD_FLAG'; flagId: string }
  | { type: 'FACT'; factId: string }
  | { type: 'BOSS_DEFEATED' };

export interface CombatUpgradeDefinition {
  id: CombatUpgradeId;
  name: string;
  description: string;
  buyPrice: number;
  /** Shown in shop; boss reward has buyPrice 0 and is not sold. */
  shopListed: boolean;
  unlock: UpgradeUnlock;
  mods: PermanentCombatMods;
}

export const COMBAT_UPGRADE_DEFINITIONS: Readonly<Record<CombatUpgradeId, CombatUpgradeDefinition>> = {
  [COMBAT_UPGRADE_ID.BLADE_EDGE]: {
    id: COMBAT_UPGRADE_ID.BLADE_EDGE,
    name: '검날 강화',
    description: '공격력 +15%. 전투 피해에 바로 반영된다.',
    buyPrice: 300,
    shopListed: true,
    unlock: { type: 'WORLD_FLAG', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED },
    mods: { attackPercent: 15, rangePercent: 0, maxHpFlat: 0 },
  },
  [COMBAT_UPGRADE_ID.LONG_BLADE]: {
    id: COMBAT_UPGRADE_ID.LONG_BLADE,
    name: '긴 칼날',
    description: '공격 사거리 +15%. 히트박스와 투사체 사거리가 늘어난다.',
    buyPrice: 300,
    shopListed: true,
    unlock: { type: 'FACT', factId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW },
    mods: { attackPercent: 0, rangePercent: 15, maxHpFlat: 0 },
  },
  [COMBAT_UPGRADE_ID.ARMOR_PLATING]: {
    id: COMBAT_UPGRADE_ID.ARMOR_PLATING,
    name: '갑옷 보강',
    description: '최대 체력 +20. 전투 시작 HP 상한에 반영된다.',
    buyPrice: 300,
    shopListed: true,
    unlock: { type: 'WORLD_FLAG', flagId: WORLD_FLAG.RUINS_GOBLINS_DEFEATED },
    mods: { attackPercent: 0, rangePercent: 0, maxHpFlat: 20 },
  },
  [COMBAT_UPGRADE_ID.GUARDIAN_CORE]: {
    id: COMBAT_UPGRADE_ID.GUARDIAN_CORE,
    name: '수호자의 핵',
    description: '수호자의 핵. 공격력 +10%, 공격 사거리 +10%.',
    buyPrice: 0,
    shopListed: false,
    unlock: { type: 'BOSS_DEFEATED' },
    mods: { attackPercent: 10, rangePercent: 10, maxHpFlat: 0 },
  },
};

export function getCombatUpgrade(upgradeId: string): CombatUpgradeDefinition | null {
  return COMBAT_UPGRADE_DEFINITIONS[upgradeId as CombatUpgradeId] ?? null;
}

export function isCombatUpgradeId(id: string): id is CombatUpgradeId {
  return id in COMBAT_UPGRADE_DEFINITIONS;
}

export function isUpgradeUnlocked(state: Readonly<GameState>, upgradeId: string): boolean {
  const def = getCombatUpgrade(upgradeId);
  if (!def) {
    return false;
  }
  const unlock = def.unlock;
  if (unlock.type === 'ALWAYS') {
    return true;
  }
  if (unlock.type === 'WORLD_FLAG') {
    return worldFlag(state, unlock.flagId);
  }
  if (unlock.type === 'FACT') {
    return doesPlayerKnowFact(state, unlock.factId);
  }
  if (unlock.type === 'BOSS_DEFEATED') {
    return worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED);
  }
  return false;
}

export function shopListedUpgradeIds(state: Readonly<GameState>): CombatUpgradeId[] {
  const purchased = state.player.purchasedUpgradeIds ?? [];
  return (Object.values(COMBAT_UPGRADE_ID) as CombatUpgradeId[]).filter((id) => {
    const def = COMBAT_UPGRADE_DEFINITIONS[id];
    return def.shopListed && !purchased.includes(id) && isUpgradeUnlocked(state, id);
  });
}

export function mergePermanentMods(
  current: PermanentCombatMods | undefined,
  delta: PermanentCombatMods
): PermanentCombatMods {
  const base = current ?? { attackPercent: 0, rangePercent: 0, maxHpFlat: 0 };
  return {
    attackPercent: base.attackPercent + delta.attackPercent,
    rangePercent: base.rangePercent + delta.rangePercent,
    maxHpFlat: base.maxHpFlat + delta.maxHpFlat,
  };
}
