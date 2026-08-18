import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { eventsForRecordedFact } from '../knowledge/knowledge-service';
import { eventsForMemoryRequests } from '../npc/memory/memory-service';
import { eventsForRelationshipRequests, relationshipRequestsForQuest } from '../relationships/relationship-service';
import type { WorldFact } from '../world/facts/world-fact';
import type { WorldFactType } from '../world/facts/world-fact';
import { getQuestDefinition } from './quest-definitions';
import { QUEST_STATUS, type QuestEffect } from './quest-types';

export function eventsForQuestEffects(state: Readonly<GameState>, questId: string, effects: readonly QuestEffect[]): GameEvent[] {
  const events: GameEvent[] = [];
  const factIds: string[] = [];

  for (const effect of effects) {
    if (effect.type === 'CREATE_WORLD_FACT') {
      const fact = createQuestWorldFact(state, questId, effect);
      if (!state.world.facts.some((item) => item.id === fact.id)) {
        events.push(...eventsForRecordedFact(fact));
        factIds.push(fact.id);
      }
      continue;
    }
    if (effect.type === 'UNLOCK_QUEST') {
      const target = state.quests[effect.questId];
      if (target && target.status === QUEST_STATUS.LOCKED) {
        events.push({ type: 'QUEST_AVAILABLE', questId: effect.questId });
      }
      continue;
    }
    if (effect.type === 'UNLOCK_SCENE') {
      events.push({ type: 'STORY_UPDATED', sceneId: effect.sceneId });
      continue;
    }
    if (effect.type === 'SET_WORLD_FLAG' && state.world.flags[effect.flagId] !== effect.value) {
      events.push({ type: 'WORLD_FLAG_SET', flagId: effect.flagId, value: effect.value });
    }
  }

  const relationshipEffects = effects.filter((effect) => effect.type === 'RELATIONSHIP_CHANGE');
  if (relationshipEffects.length > 0 || getQuestDefinition(questId)?.requesterNpcId) {
    const requests = relationshipRequestsForQuest(state, questId);
    events.push(...eventsForRelationshipRequests(state, requests));
    events.push(...eventsForMemoryRequests(state, requests, factIds));
  }

  return events;
}

function createQuestWorldFact(
  state: Readonly<GameState>,
  questId: string,
  effect: Extract<QuestEffect, { type: 'CREATE_WORLD_FACT' }>
): WorldFact {
  const factType = (effect.factType as WorldFactType) ?? 'QUEST_COMPLETED';
  return {
    id: effect.factId ?? `fact_${factType.toLowerCase()}_${questId}`,
    type: factType,
    occurredAtTurn: state.world.turn,
    locationId: state.world.currentLocationId,
    actorIds: ['player'],
    targetIds: [questId],
    witnessIds: ['player'],
    tags: effect.tags ?? ['quest'],
    publicLevel: 'PRIVATE',
    payload: { questId },
  };
}
