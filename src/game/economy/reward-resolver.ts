import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { canonicalEncounterId } from '../combat/encounters/encounter-progress';
import { getItemDefinition } from '../inventory/item-definitions';
import { getQuestDefinition } from '../quests/quest-definitions';
import { EXP_REWARD } from '../player/progression/level-config';
import { COMBAT_UPGRADE_ID, getCombatUpgrade } from './combat-upgrades';
import { encounterRewardFor, QUEST_REWARD_FALLBACK } from './reward-config';
import { eventsForGoldGained } from './gold-rules';
import type { GoldReason, RewardBundle } from './economy-types';

function eventsForRewardBundle(
  state: Readonly<GameState>,
  bundle: RewardBundle,
  sourceEventId: string,
  goldReason: GoldReason
): GameEvent[] {
  const events: GameEvent[] = [];
  if (bundle.gold && bundle.gold > 0) {
    events.push(...eventsForGoldGained(state, bundle.gold, goldReason, `${sourceEventId}:gold`));
  }
  for (const item of bundle.items ?? []) {
    if (!getItemDefinition(item.itemId) || item.quantity <= 0) {
      continue;
    }
    events.push({
      type: 'ITEM_OBTAINED',
      itemId: item.itemId,
      quantity: item.quantity,
      sourceEventId: `${sourceEventId}:item:${item.itemId}`,
    });
  }
  return events;
}

export function eventsForCombatRewards(
  state: Readonly<GameState>,
  combatId: string,
  options: { firstClear: boolean } = { firstClear: true }
): GameEvent[] {
  const clearedId = canonicalEncounterId(combatId);
  const boss = clearedId === ENCOUNTER_ID.RUINS_BOSS_01 || combatId === ENCOUNTER_ID.RUINS_BOSS_01;
  const firstClear = options.firstClear;
  const bundle = encounterRewardFor(clearedId, firstClear);
  // First clear: stable ids so Save/Load cannot re-grant. Repeat gold: turn-scoped drip.
  const sourceEventId = firstClear
    ? `reward:combat:first:${clearedId}`
    : `reward:combat:repeat:${clearedId}:${state.world.turn}`;
  const events = eventsForRewardBundle(state, bundle, sourceEventId, boss ? 'BOSS' : 'ENCOUNTER');
  if (firstClear && boss) {
    const core = getCombatUpgrade(COMBAT_UPGRADE_ID.GUARDIAN_CORE);
    if (core && !(state.player.purchasedUpgradeIds ?? []).includes(core.id)) {
      events.push({
        type: 'COMBAT_UPGRADE_APPLIED',
        upgradeId: core.id,
        sourceEventId: `reward:combat:first:${clearedId}:guardian-core`,
        mods: core.mods,
      });
    }
  }
  return events;
}

export function eventsForQuestRewards(state: Readonly<GameState>, questId: string): GameEvent[] {
  const sourceEventId = `reward:quest:${questId}`;
  const definition = getQuestDefinition(questId);
  const bundle = definition?.reward ?? QUEST_REWARD_FALLBACK[questId] ?? {};
  return eventsForRewardBundle(state, bundle, sourceEventId, 'QUEST');
}

export function questExpAmount(questId: string): number {
  const definition = getQuestDefinition(questId);
  return definition?.reward?.exp ?? EXP_REWARD.QUEST;
}

export function combatRewardSummary(combatId: string, firstClear = true): string {
  const bundle = encounterRewardFor(canonicalEncounterId(combatId), firstClear);
  const parts: string[] = [];
  if (firstClear) {
    parts.push('★ 첫 클리어');
  } else {
    parts.push('재도전');
  }
  if (bundle.gold) {
    parts.push(`+${bundle.gold} G`);
  }
  for (const item of bundle.items ?? []) {
    const name = getItemDefinition(item.itemId)?.name ?? item.itemId;
    parts.push(`${name} x${item.quantity}`);
  }
  if (firstClear && combatId === ENCOUNTER_ID.RUINS_BOSS_01) {
    parts.push('수호자의 핵');
  }
  return parts.join(' · ');
}
