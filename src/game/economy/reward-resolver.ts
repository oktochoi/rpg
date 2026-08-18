import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { getItemDefinition } from '../inventory/item-definitions';
import { getQuestDefinition } from '../quests/quest-definitions';
import { EXP_REWARD } from '../player/progression/level-config';
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

export function eventsForCombatRewards(state: Readonly<GameState>, combatId: string): GameEvent[] {
  const sourceEventId = `reward:combat:${combatId}:${state.world.turn}`;
  const boss = combatId === ENCOUNTER_ID.RUINS_BOSS_01;
  const bundle = encounterRewardFor(combatId);
  return eventsForRewardBundle(state, bundle, sourceEventId, boss ? 'BOSS' : 'ENCOUNTER');
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

export function combatRewardSummary(combatId: string): string {
  const bundle = encounterRewardFor(combatId);
  const parts: string[] = [];
  if (bundle.gold) {
    parts.push(`+${bundle.gold} G`);
  }
  for (const item of bundle.items ?? []) {
    const name = getItemDefinition(item.itemId)?.name ?? item.itemId;
    parts.push(`${name} x${item.quantity}`);
  }
  return parts.join(' · ');
}
