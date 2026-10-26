import type { GameState } from '../core/game-state';
import type { QuestId } from '../core/ids';
import { getQuestDefinition } from './quest-definitions';
import {
  QUEST_STATUS,
  type QuestObjectiveDefinition,
  type QuestObjectiveProgress,
  type QuestRequirement,
  type QuestState,
  type QuestStatus,
} from './quest-types';

export function getQuestRuntime(state: Readonly<GameState>, questId: string): QuestState | undefined {
  return state.quests[questId];
}

export function activeQuestIds(state: Readonly<GameState>): string[] {
  return Object.values(state.quests)
    .filter((quest) => quest.status === QUEST_STATUS.ACTIVE)
    .map((quest) => quest.id);
}

export function completedQuestIds(state: Readonly<GameState>): string[] {
  return Object.values(state.quests)
    .filter((quest) => quest.status === QUEST_STATUS.COMPLETED)
    .map((quest) => quest.id);
}

export function relevantQuestStates(state: Readonly<GameState>, npcId?: string): QuestState[] {
  return Object.values(state.quests).filter((quest) => {
    if (quest.status === QUEST_STATUS.LOCKED) {
      return false;
    }
    if (!npcId) {
      return quest.status === QUEST_STATUS.ACTIVE || quest.status === QUEST_STATUS.AVAILABLE || quest.status === QUEST_STATUS.COMPLETED;
    }
    const definition = getQuestDefinition(quest.id);
    return definition?.requesterNpcId === npcId || quest.requesterNpcId === npcId;
  });
}

export function isQuestCompleted(state: Readonly<GameState>, questId: string): boolean {
  return state.quests[questId]?.status === QUEST_STATUS.COMPLETED;
}

export function requirementsMet(state: Readonly<GameState>, requirements: readonly QuestRequirement[] | undefined): boolean {
  if (!requirements || requirements.length === 0) {
    return true;
  }
  return requirements.every((requirement) => {
    if (requirement.type === 'QUEST_COMPLETED') {
      return isQuestCompleted(state, requirement.questId);
    }
    if (requirement.type === 'FACT_KNOWN') {
      return state.knowledge.knownFactIds.includes(requirement.factId);
    }
    if (requirement.type === 'SCENE_VISITED') {
      return (state.story.visitedSceneIds ?? []).includes(requirement.sceneId);
    }
    if (requirement.type === 'WORLD_FLAG') {
      return state.world.flags[requirement.flagId] === true;
    }
    const value = state.relationships[requirement.npcId]?.[requirement.field] ?? 0;
    return value >= requirement.value;
  });
}

export function requiredObjectives(definitionObjectives: readonly QuestObjectiveDefinition[]): QuestObjectiveDefinition[] {
  return definitionObjectives.filter((objective) => !objective.optional);
}

export function isQuestReadyToComplete(quest: QuestState, objectives: readonly QuestObjectiveDefinition[]): boolean {
  if (quest.status !== QUEST_STATUS.ACTIVE) {
    return false;
  }
  return requiredObjectives(objectives).every((objective) => quest.objectiveProgress[objective.id]?.completed === true);
}

export function currentObjective(quest: QuestState, objectives: readonly QuestObjectiveDefinition[]): QuestObjectiveDefinition | undefined {
  return objectives.find((objective) => !quest.objectiveProgress[objective.id]?.completed);
}

export function completedRequiredCount(quest: QuestState, objectives: readonly QuestObjectiveDefinition[]): number {
  const required = requiredObjectives(objectives);
  return required.filter((objective) => quest.objectiveProgress[objective.id]?.completed).length;
}

export function statusLabel(status: QuestStatus): string {
  if (status === QUEST_STATUS.AVAILABLE) {
    return '수락 가능';
  }
  if (status === QUEST_STATUS.ACTIVE) {
    return '진행 중';
  }
  if (status === QUEST_STATUS.COMPLETED) {
    return '완료';
  }
  if (status === QUEST_STATUS.FAILED) {
    return '실패';
  }
  return '잠김';
}

export function emptyProgress(objectives: readonly QuestObjectiveDefinition[]): Record<string, QuestObjectiveProgress> {
  const progress: Record<string, QuestObjectiveProgress> = {};
  for (const objective of objectives) {
    progress[objective.id] = {
      objectiveId: objective.id,
      currentCount: 0,
      completed: false,
      countedIds: [],
    };
  }
  return progress;
}

export function featuredQuest(state: Readonly<GameState>): QuestState | undefined {
  const list = Object.values(state.quests);
  const mainActive = list.find((quest) => {
    if (quest.status !== QUEST_STATUS.ACTIVE) {
      return false;
    }
    return getQuestDefinition(quest.id)?.category !== 'SIDE';
  });
  if (mainActive) {
    return mainActive;
  }
  return list.find((quest) => quest.status === QUEST_STATUS.ACTIVE);
}

export type { QuestId };
