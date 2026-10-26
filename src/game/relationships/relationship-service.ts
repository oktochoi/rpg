import type { CombatResult } from '../combat/types/combat-result';
import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import type { NpcId } from '../core/ids';
import { isNpcDuelCombatId } from '../actions/action-validator';
import { getPresentEntityIds } from '../actions/entity-resolver';
import { TEST_GOBLIN_COMBAT_ID } from '../story/test-scenes';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { toRelationshipDelta } from './relationship-rules';
import type { RelationshipChangeReason, RelationshipRequest } from './relationship-types';

export function eventsForRelationshipRequests(
  state: Readonly<GameState>,
  requests: readonly RelationshipRequest[]
): GameEvent[] {
  const events: GameEvent[] = [];
  const seen = new Set(state.processedRelationshipSourceIds);

  for (const request of requests) {
    if (!state.npcs[request.npcId]) {
      continue;
    }
    if (seen.has(request.sourceEventId)) {
      continue;
    }
    seen.add(request.sourceEventId);
    const delta = toRelationshipDelta(request.npcId, request.reason, request.sourceEventId);
    if (!hasNumericDelta(delta)) {
      continue;
    }
    events.push({
      type: 'NPC_RELATIONSHIP_CHANGED',
      npcId: request.npcId,
      delta: {
        affection: delta.affection ?? 0,
        trust: delta.trust ?? 0,
        fear: delta.fear ?? 0,
        respect: delta.respect ?? 0,
      },
      reason: request.reason,
      sourceEventId: request.sourceEventId,
    });
  }

  return events;
}

function hasNumericDelta(delta: { affection?: number; trust?: number; fear?: number; respect?: number }): boolean {
  return Boolean(delta.affection || delta.trust || delta.fear || delta.respect);
}

export function relationshipRequestsForAction(input: {
  actionType: string;
  targetId?: string;
  turnId: number;
  npcIds: readonly string[];
}): RelationshipRequest[] {
  const { actionType, targetId, turnId } = input;
  if (!targetId) {
    return [];
  }

  const source = (reason: RelationshipChangeReason) => `action:${turnId}:${actionType}:${reason}:${targetId}`;

  if (actionType === 'HELP') {
    return [{ npcId: targetId, reason: 'PLAYER_HELPED_NPC', sourceEventId: source('PLAYER_HELPED_NPC') }];
  }
  if (actionType === 'RESCUE') {
    return [{ npcId: targetId, reason: 'PLAYER_HELPED_NPC', sourceEventId: source('PLAYER_HELPED_NPC') }];
  }
  if (actionType === 'THREATEN') {
    return [{ npcId: targetId, reason: 'PLAYER_THREATENED_NPC', sourceEventId: source('PLAYER_THREATENED_NPC') }];
  }
  if (actionType === 'ATTACK' && targetId !== 'goblin_01') {
    return [{ npcId: targetId, reason: 'PLAYER_ATTACKED_NPC', sourceEventId: source('PLAYER_ATTACKED_NPC') }];
  }
  if (actionType === 'GIVE' || actionType === 'BRIBE') {
    return [{ npcId: targetId, reason: 'PLAYER_GAVE_GIFT', sourceEventId: source('PLAYER_GAVE_GIFT') }];
  }
  return [];
}

export function relationshipRequestsForCombat(
  state: Readonly<GameState>,
  result: CombatResult
): RelationshipRequest[] {
  const requests: RelationshipRequest[] = [];
  const presentNpcs = getPresentEntityIds(state).filter((id) => state.npcs[id]);

  if (result.outcome === 'VICTORY') {
    const witnessed =
      result.combatId === TEST_GOBLIN_COMBAT_ID ||
      result.combatId === ENCOUNTER_ID.CH1_FOREST_SCOUTS ||
      result.combatId === ENCOUNTER_ID.CH1_GOBLIN_CAMP ||
      result.combatId === ENCOUNTER_ID.RUINS_BOSS_01;
    if (witnessed) {
      for (const npcId of presentNpcs) {
        requests.push({
          npcId,
          reason: 'PLAYER_SHOWED_SKILL',
          sourceEventId: `combat:${result.combatId}:PLAYER_SHOWED_SKILL:${npcId}`,
        });
      }
    }
  }

  if (result.outcome === 'VICTORY' && isNpcDuelCombatId(result.combatId)) {
    const npcId = result.combatId.replace('combat_duel_', '');
    if (state.npcs[npcId]) {
      requests.push({
        npcId,
        reason: 'PLAYER_DEFEATED_NPC',
        sourceEventId: `combat:${result.combatId}:PLAYER_DEFEATED_NPC:${npcId}`,
      });
    }
  }

  return requests;
}

export function relationshipRequestsForQuest(state: Readonly<GameState>, questId: string): RelationshipRequest[] {
  const quest = state.quests[questId];
  if (!quest?.requesterNpcId || quest.status === QUEST_STATUS.COMPLETED) {
    return [];
  }
  const requests: RelationshipRequest[] = [
    {
      npcId: quest.requesterNpcId,
      reason: 'PLAYER_COMPLETED_REQUEST',
      sourceEventId: `quest:${questId}:PLAYER_COMPLETED_REQUEST:${quest.requesterNpcId}`,
    },
  ];
  const proved =
    questId === QUEST_ID.FOREST_GOBLIN_SCOUR ||
    questId === QUEST_ID.LEON_GOBLIN_WATCH ||
    questId === QUEST_ID.RUINS_MYSTERY;
  if (proved) {
    requests.push({
      npcId: quest.requesterNpcId,
      reason: 'PLAYER_PROVED_CAPABILITY',
      sourceEventId: `quest:${questId}:PLAYER_PROVED_CAPABILITY:${quest.requesterNpcId}`,
    });
  }
  return requests;
}

export function authoredRescueRequest(npcId: NpcId, sourceEventId = `authored:rescue:${npcId}`): RelationshipRequest {
  return {
    npcId,
    reason: 'PLAYER_SAVED_NPC',
    sourceEventId,
  };
}

export function relationshipRequestsForShare(fromId: string, toId: NpcId, factId: string): RelationshipRequest[] {
  if (fromId !== 'player') {
    return [];
  }
  return [
    {
      npcId: toId,
      reason: 'PLAYER_SHARED_INFORMATION',
      sourceEventId: `share:${factId}:PLAYER_SHARED_INFORMATION:${toId}`,
    },
  ];
}
