import { allQuestDefinitions, getQuestDefinition } from './quest-definitions';
import { emptyProgress } from './quest-selectors';
import { QUEST_STATUS, type QuestState, type QuestStatus } from './quest-types';

export function createQuestRuntime(questId: string, status: QuestStatus = QUEST_STATUS.LOCKED): QuestState | null {
  const definition = getQuestDefinition(questId);
  if (!definition) {
    return null;
  }
  return {
    id: definition.id,
    questId: definition.id,
    status,
    requesterNpcId: definition.requesterNpcId,
    objectiveProgress: emptyProgress(definition.objectives),
  };
}

export function createInitialQuestRuntimes(): Record<string, QuestState> {
  const quests: Record<string, QuestState> = {};
  for (const definition of allQuestDefinitions()) {
    const runtime = createQuestRuntime(definition.id, QUEST_STATUS.LOCKED);
    if (runtime) {
      quests[definition.id] = runtime;
    }
  }
  return quests;
}
