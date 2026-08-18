import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { resolveEncounterId } from '../combat/encounters/encounter-definitions';
import { eventsForRecordedFact } from '../knowledge/knowledge-service';
import type { WorldFact } from '../world/facts/world-fact';
import { RUINS_OFFER_TOPIC, RUINS_REPORT_TOPIC, RUINS_SEAL_FACT_ID, getQuestDefinition } from './quest-definitions';
import { eventsForQuestEffects } from './quest-effects';
import { isQuestReadyToComplete } from './quest-selectors';
import {
  QUEST_OBJECTIVE_TYPE,
  QUEST_STATUS,
  type QuestObjectiveDefinition,
  type QuestObjectiveProgress,
  type QuestState,
} from './quest-types';

export function dialogueMatchesTopic(playerText: string, topicId: string): boolean {
  const text = playerText.trim();
  if (topicId === RUINS_OFFER_TOPIC) {
    return /폐허|조사|마력|맡겠/.test(text);
  }
  if (topicId === RUINS_REPORT_TOPIC) {
    return /발견|마법석|문장|보고|조사 결과|돌아왔/.test(text);
  }
  if (topicId === 'knight_ruins') {
    return /레온|기사|왕궁|폐허/.test(text);
  }
  return text.includes(topicId);
}

export function encounterMatches(combatId: string, targetId: string): boolean {
  if (combatId === targetId || resolveEncounterId(combatId) === targetId) {
    return true;
  }
  const aliases: Record<string, readonly string[]> = {
    ch1_forest_scouts: ['forest_goblin_01', 'ch1_forest_scouts'],
    forest_goblin_01: ['forest_goblin_01', 'ch1_forest_scouts'],
    ch1_ruins_gate: ['ruins_mixed_01', 'ch1_ruins_gate'],
    ruins_mixed_01: ['ruins_mixed_01', 'ch1_ruins_gate'],
  };
  return (aliases[targetId] ?? []).includes(combatId) || (aliases[combatId] ?? []).includes(targetId);
}

export function enemyMatchesType(enemyId: string, targetId: string): boolean {
  return enemyId === targetId || enemyId.startsWith(`${targetId}_`) || enemyId.startsWith(targetId);
}

function progressFor(quest: QuestState, objective: QuestObjectiveDefinition): QuestObjectiveProgress {
  return (
    quest.objectiveProgress[objective.id] ?? {
      objectiveId: objective.id,
      currentCount: 0,
      completed: false,
      countedIds: [],
    }
  );
}

function withProgress(
  quest: QuestState,
  objective: QuestObjectiveDefinition,
  currentCount: number,
  completed: boolean,
  countedIds: readonly string[]
): QuestState {
  return {
    ...quest,
    objectiveProgress: {
      ...quest.objectiveProgress,
      [objective.id]: {
        objectiveId: objective.id,
        currentCount,
        completed,
        countedIds,
      },
    },
  };
}

export function progressEventsForObjective(
  quest: QuestState,
  objective: QuestObjectiveDefinition,
  currentCount: number,
  requiredCount: number,
  countedIds: readonly string[]
): { events: GameEvent[]; quest: QuestState } {
  const previous = progressFor(quest, objective);
  if (previous.completed) {
    return { events: [], quest };
  }
  const completed = currentCount >= requiredCount;
  const next = withProgress(quest, objective, currentCount, completed, countedIds);
  const events: GameEvent[] = [
    {
      type: 'QUEST_OBJECTIVE_PROGRESS',
      questId: quest.id,
      objectiveId: objective.id,
      currentCount,
      completed,
    },
  ];
  if (completed) {
    events.push({ type: 'QUEST_OBJECTIVE_COMPLETED', questId: quest.id, objectiveId: objective.id });
  }
  return { events, quest: next };
}

export function matchObjectiveEvent(
  state: Readonly<GameState>,
  quest: QuestState,
  objective: QuestObjectiveDefinition,
  event: GameEvent
): { events: GameEvent[]; quest: QuestState } | null {
  const previous = progressFor(quest, objective);
  if (previous.completed) {
    return null;
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.TALK_TO_NPC) {
    if (objective.requiredFactId && event.type === 'NPC_LEARNED_FACT') {
      if (event.npcId === objective.targetId && event.entry.factId === objective.requiredFactId) {
        return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
      }
    }
    if (event.type === 'DIALOGUE_STARTED' && event.npcId === objective.targetId) {
      if (objective.requiredFactId || objective.conversationTopicId) {
        return null;
      }
      return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
    }
    if (event.type === 'DIALOGUE_TURN_RECORDED' && event.npcId === objective.targetId) {
      if (objective.requiredFactId) {
        return null;
      }
      if (objective.conversationTopicId && !dialogueMatchesTopic(event.playerText, objective.conversationTopicId)) {
        return null;
      }
      return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
    }
    return null;
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.WIN_ENCOUNTER && event.type === 'COMBAT_WON') {
    if (!objective.targetId || !encounterMatches(event.combatId, objective.targetId)) {
      return null;
    }
    return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.DEFEAT_ENEMY && event.type === 'ENEMY_DEFEATED') {
    if (!objective.targetId || !enemyMatchesType(event.enemyId, objective.targetId)) {
      return null;
    }
    const counted = new Set(previous.countedIds ?? []);
    if (counted.has(event.enemyId)) {
      return null;
    }
    counted.add(event.enemyId);
    const required = objective.requiredCount ?? 1;
    return progressEventsForObjective(quest, objective, counted.size, required, [...counted]);
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.VISIT_LOCATION && event.type === 'LOCATION_ENTERED') {
    if (objective.targetId && event.locationId !== objective.targetId) {
      return null;
    }
    return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.INVESTIGATE && event.type === 'AREA_INVESTIGATED') {
    if (objective.targetId && event.locationId !== objective.targetId) {
      return null;
    }
    return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.OBTAIN_ITEM && event.type === 'ITEM_RECEIVED') {
    if (objective.targetId && event.itemId !== objective.targetId) {
      return null;
    }
    return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.LEARN_FACT && event.type === 'PLAYER_LEARNED_FACT') {
    if (objective.targetId && event.factId !== objective.targetId && event.factId !== objective.requiredFactId) {
      return null;
    }
    if (objective.requiredFactId && event.factId !== objective.requiredFactId) {
      return null;
    }
    return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
  }

  if (objective.type === QUEST_OBJECTIVE_TYPE.FREE_ACTION_RESULT && event.type === 'ACTION_RESOLVED') {
    if (!event.resolution.success) {
      return null;
    }
    if (objective.targetId && event.resolution.actionType !== objective.targetId) {
      return null;
    }
    return progressEventsForObjective(quest, objective, 1, 1, previous.countedIds ?? []);
  }

  return null;
}

export function createRuinsSealFact(state: Readonly<GameState>): WorldFact {
  return {
    id: RUINS_SEAL_FACT_ID,
    type: 'INFORMATION_REVEALED',
    occurredAtTurn: state.world.turn,
    locationId: state.world.currentLocationId,
    actorIds: ['player'],
    witnessIds: ['player'],
    tags: ['ruins', 'royal_seal', 'discovery'],
    publicLevel: 'PRIVATE',
    payload: {
      discovery: 'royal_seal_stone',
      summary: '폐허 안에서 왕실 문장이 새겨진 마법석을 발견했다.',
    },
  };
}

export function discoveryEventsForInvestigate(state: Readonly<GameState>, quest: QuestState, objectiveId: string): GameEvent[] {
  if (objectiveId !== 'investigate_ruins' || quest.id !== 'ruins_mystery') {
    return [];
  }
  if (state.world.facts.some((fact) => fact.id === RUINS_SEAL_FACT_ID)) {
    return [];
  }
  return eventsForRecordedFact(createRuinsSealFact(state));
}

export function completionEventsIfReady(state: Readonly<GameState>, quest: QuestState): GameEvent[] {
  const definition = getQuestDefinition(quest.id);
  if (!definition || quest.status === QUEST_STATUS.COMPLETED) {
    return [];
  }
  if (!isQuestReadyToComplete(quest, definition.objectives)) {
    return [];
  }
  return [{ type: 'QUEST_COMPLETED', questId: quest.id }, ...eventsForQuestEffects(state, quest.id, definition.completionEffects ?? [])];
}
