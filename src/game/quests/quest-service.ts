import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { applyEvents } from '../core/reducer';
import { allQuestDefinitions, getQuestDefinition } from './quest-definitions';
import { eventsForQuestEffects } from './quest-effects';
import {
  completionEventsIfReady,
  dialogueMatchesTopic,
  discoveryEventsForInvestigate,
  matchObjectiveEvent,
} from './quest-progress';
import { requirementsMet } from './quest-selectors';
import { QUEST_STATUS, type QuestObjectiveProgress, type QuestState } from './quest-types';

function cloneQuest(quest: QuestState): QuestState {
  const progress: Record<string, QuestObjectiveProgress> = {};
  for (const [id, item] of Object.entries(quest.objectiveProgress)) {
    progress[id] = {
      objectiveId: item.objectiveId,
      currentCount: item.currentCount,
      completed: item.completed,
      countedIds: [...(item.countedIds ?? [])],
    };
  }
  return {
    ...quest,
    objectiveProgress: progress,
  };
}

export function eventsForQuestProgress(state: Readonly<GameState>, incoming: readonly GameEvent[]): GameEvent[] {
  if (incoming.length === 0) {
    return [];
  }

  let simulated = applyEvents(state, incoming);
  const outgoing: GameEvent[] = [];
  const working = new Map<string, QuestState>();
  for (const quest of Object.values(simulated.quests)) {
    working.set(quest.id, cloneQuest(quest));
  }

  const unlockEvents = availabilityEvents(state, simulated, incoming);
  for (const event of unlockEvents) {
    outgoing.push(event);
    simulated = applyEvents(simulated, [event]);
    const quest = working.get(event.questId);
    if (quest && event.type === 'QUEST_AVAILABLE') {
      working.set(quest.id, { ...quest, status: QUEST_STATUS.AVAILABLE });
    }
  }

  for (const event of incoming) {
    if (event.type === 'QUEST_STARTED') {
      const quest = working.get(event.questId);
      if (quest) {
        working.set(quest.id, { ...quest, status: QUEST_STATUS.ACTIVE, startedAtTurn: simulated.world.turn });
      }
    }
    if (event.type === 'QUEST_COMPLETED') {
      const originalQuest = state.quests[event.questId];
      const definition = getQuestDefinition(event.questId);
      if (originalQuest && originalQuest.status !== QUEST_STATUS.COMPLETED && definition) {
        const effects = eventsForQuestEffects(state, originalQuest.id, definition.completionEffects ?? []);
        for (const extra of effects) {
          outgoing.push(extra);
          simulated = applyEvents(simulated, [extra]);
        }
        working.set(event.questId, {
          ...originalQuest,
          status: QUEST_STATUS.COMPLETED,
          completedAtTurn: simulated.world.turn,
        });
      }
      continue;
    }

    for (const quest of [...working.values()]) {
      if (quest.status !== QUEST_STATUS.ACTIVE) {
        continue;
      }
      const definition = getQuestDefinition(quest.id);
      if (!definition) {
        continue;
      }
      for (const objective of definition.objectives) {
        const matched = matchObjectiveEvent(simulated, quest, objective, event);
        if (!matched) {
          continue;
        }
        working.set(quest.id, matched.quest);
        for (const progressEvent of matched.events) {
          outgoing.push(progressEvent);
          simulated = applyEvents(simulated, [progressEvent]);
          if (progressEvent.type === 'QUEST_OBJECTIVE_COMPLETED') {
            const discovery = discoveryEventsForInvestigate(simulated, matched.quest, objective.id);
            for (const extra of discovery) {
              outgoing.push(extra);
              simulated = applyEvents(simulated, [extra]);
            }
          }
        }
      }
      const latest = working.get(quest.id);
      if (!latest) {
        continue;
      }
      const complete = completionEventsIfReady(
        { ...simulated, quests: { ...simulated.quests, [latest.id]: latest } },
        latest
      );
      if (complete.length === 0) {
        continue;
      }
      working.set(latest.id, { ...latest, status: QUEST_STATUS.COMPLETED, completedAtTurn: simulated.world.turn });
      for (const extra of complete) {
        outgoing.push(extra);
        simulated = applyEvents(simulated, [extra]);
      }
    }
  }

  return outgoing;
}

function availabilityEvents(
  original: Readonly<GameState>,
  simulated: Readonly<GameState>,
  incoming: readonly GameEvent[]
): Extract<GameEvent, { type: 'QUEST_AVAILABLE' }>[] {
  const events: Extract<GameEvent, { type: 'QUEST_AVAILABLE' }>[] = [];
  for (const definition of allQuestDefinitions()) {
    const runtime = simulated.quests[definition.id] ?? original.quests[definition.id];
    if (!runtime || runtime.status !== QUEST_STATUS.LOCKED) {
      continue;
    }
    if (!requirementsMet(simulated, definition.prerequisites)) {
      continue;
    }
    const triggers = definition.availabilityTriggers ?? [];
    if (triggers.length === 0 && (definition.prerequisites?.length ?? 0) > 0) {
      events.push({ type: 'QUEST_AVAILABLE', questId: definition.id });
      continue;
    }
    const triggered = triggers.some((trigger) =>
      incoming.some((event) => {
        if (event.type !== 'DIALOGUE_TURN_RECORDED' || event.npcId !== trigger.npcId) {
          return false;
        }
        return dialogueMatchesTopic(event.playerText, trigger.topicId);
      })
    );
    if (triggered) {
      events.push({ type: 'QUEST_AVAILABLE', questId: definition.id });
    }
  }
  return events;
}
