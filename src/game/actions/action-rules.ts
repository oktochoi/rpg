import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { eventsForRecordedFact } from '../knowledge/knowledge-service';
import { createActionFact } from '../world/facts/fact-service';
import type { ResolvedFreeAction } from './action-resolver';
import type { WorldFactType } from '../world/facts/world-fact';
import { combatIdForAttack, isNpcDuelCombatId } from './action-validator';
import { isStartableCombatId } from '../combat/encounters/encounter-definitions';
import { TEST_GOBLIN_COMBAT_ID } from '../story/test-scenes';
import {
  eventsForRelationshipRequests,
  relationshipRequestsForAction,
} from '../relationships/relationship-service';
import { eventsForMemoryRecall, eventsForMemoryRequests } from '../npc/memory/memory-service';
import { eventsForMoveToLocation } from '../world/locations/location-rules';
import { eventsForExplorationPoint } from '../world/exploration/exploration-service';
import { getExplorationPoint } from '../world/exploration/exploration-definitions';
import { eventsForRestEffects } from '../time/day-rules';
import { eventsForUseItem } from '../inventory/item-rules';

export function eventsForBeginFreeAction(turnId: number, input: string): GameEvent[] {
  return [{ type: 'ACTION_RESOLVE_STARTED', turnId, input }];
}

export function eventsForCommitFreeAction(
  state: Readonly<GameState>,
  payload: ResolvedFreeAction,
  rawInput: string
): GameEvent[] {
  const events: GameEvent[] = [];
  const generatedIds: string[] = [];

  if (payload.recordPlayerLine) {
    events.push({ type: 'PLAYER_LINE_RECORDED', text: rawInput });
  }

  if (payload.dialogue) {
    events.push({
      type: 'DIALOGUE_TURN_RECORDED',
      npcId: payload.dialogue.npcId,
      playerText: payload.dialogue.playerText,
      npcText: payload.dialogue.npcText,
    });
    events.push(
      ...eventsForMemoryRecall(
        payload.dialogue.npcId,
        payload.dialogue.usedMemoryIds ?? [],
        state.world.turn
      )
    );
  }

  if (payload.gold) {
    events.push({ type: 'GOLD_SPENT', amount: payload.gold.amount });
    events.push({ type: 'NPC_RECEIVED_GOLD', npcId: payload.gold.targetId, amount: payload.gold.amount });
  }

  if (payload.itemReceived) {
    events.push({ type: 'ITEM_RECEIVED', itemId: payload.itemReceived });
  }

  if (payload.moveToLocationId) {
    events.push(...eventsForMoveToLocation(state, payload.moveToLocationId));
  }

  if (payload.explorationPointId && !payload.alreadyExplored) {
    const point = getExplorationPoint(payload.explorationPointId);
    if (point) {
      events.push(...eventsForExplorationPoint(state, point));
    }
  }

  if (payload.rest) {
    events.push(...eventsForRestEffects(state));
  }

  if (payload.consumeItemId) {
    events.push(
      ...eventsForUseItem(state, payload.consumeItemId).filter((event) => event.type !== 'ACTION_RESOLVED')
    );
  }

  if (payload.resolution.actionType === 'INVESTIGATE') {
    events.push({ type: 'AREA_INVESTIGATED', locationId: state.world.currentLocationId });
  }

  if (payload.recordFact && payload.factKey) {
    const fact = createActionFact(state, payload.recordFact as WorldFactType, payload.factKey, {
      targetIds: payload.factTargetIds,
      tags: ['action', payload.resolution.actionType.toLowerCase()],
    });
    generatedIds.push(fact.id);
    events.push(...eventsForRecordedFact(fact));
  }

  if (payload.combatId) {
    const combatId =
      payload.combatId === TEST_GOBLIN_COMBAT_ID ||
      isNpcDuelCombatId(payload.combatId) ||
      isStartableCombatId(payload.combatId)
        ? payload.combatId
        : combatIdForAttack(payload.combatId);
    events.push({ type: 'COMBAT_STARTED', combatId });
  }

  const resolution = {
    ...payload.resolution,
    generatedEventIds: [...(payload.resolution.generatedEventIds ?? []), ...generatedIds],
  };
  events.push({ type: 'ACTION_RESOLVED', turnId: state.pendingFreeActionTurnId ?? state.world.turn, resolution });

  if (payload.resolution.success) {
    const requests = relationshipRequestsForAction({
      actionType: payload.resolution.actionType,
      targetId: payload.targetNpcId,
      turnId: state.pendingFreeActionTurnId ?? state.world.turn,
      npcIds: payload.factTargetIds ?? [],
    });
    events.push(...eventsForRelationshipRequests(state, requests));
    events.push(...eventsForMemoryRequests(state, requests, generatedIds));
  }

  return events;
}
