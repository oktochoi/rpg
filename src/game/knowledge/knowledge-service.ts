import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import type { NpcId } from '../core/ids';
import { PLAYER_ACTOR_ID } from './knowledge-config';
import {
  createPublicFactEntry,
  createSharedFactEntry,
  createWitnessEntry,
  type ShareFactInput,
} from './knowledge-selectors';
import type { WorldFact } from '../world/facts/world-fact';

export function eventsForRecordedFact(fact: WorldFact): GameEvent[] {
  const events: GameEvent[] = [{ type: 'WORLD_FACT_RECORDED', fact }];

  for (const witnessId of fact.witnessIds) {
    if (witnessId === PLAYER_ACTOR_ID) {
      events.push({ type: 'PLAYER_LEARNED_FACT', factId: fact.id });
      continue;
    }

    events.push({
      type: 'NPC_LEARNED_FACT',
      npcId: witnessId,
      entry: createWitnessEntry(fact.id, fact.occurredAtTurn),
    });
  }

  return events;
}

export function eventsForShareFact(state: Readonly<GameState>, input: ShareFactInput): GameEvent[] {
  const entry = createSharedFactEntry(state, input);
  if (!entry) {
    return [];
  }

  return [
    {
      type: 'NPC_LEARNED_FACT',
      npcId: input.toId,
      entry,
    },
  ];
}

export function eventsForPublicReveal(
  fact: WorldFact,
  npcIds: readonly NpcId[]
): GameEvent[] {
  return npcIds.map((npcId) => ({
    type: 'NPC_LEARNED_FACT' as const,
    npcId,
    entry: createPublicFactEntry(fact.id, fact.occurredAtTurn),
  }));
}

export function eventsForGrantFact(
  state: Readonly<GameState>,
  npcId: NpcId,
  factId: WorldFact['id']
): GameEvent[] {
  const fact = state.world.facts.find((item) => item.id === factId);
  if (!fact || !state.npcs[npcId]) {
    return [];
  }
  if (state.npcs[npcId].knowledge.entries.some((entry) => entry.factId === factId)) {
    return [];
  }

  return [
    {
      type: 'NPC_LEARNED_FACT',
      npcId,
      entry: createWitnessEntry(factId, state.world.turn),
    },
  ];
}
