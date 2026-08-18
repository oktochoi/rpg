import type { NpcId, QuestId, SceneId } from '../core/ids';

export const QUEST_STATUS = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type QuestStatus = (typeof QUEST_STATUS)[keyof typeof QUEST_STATUS];

export const QUEST_OBJECTIVE_TYPE = {
  TALK_TO_NPC: 'TALK_TO_NPC',
  DEFEAT_ENEMY: 'DEFEAT_ENEMY',
  WIN_ENCOUNTER: 'WIN_ENCOUNTER',
  VISIT_LOCATION: 'VISIT_LOCATION',
  OBTAIN_ITEM: 'OBTAIN_ITEM',
  INVESTIGATE: 'INVESTIGATE',
  LEARN_FACT: 'LEARN_FACT',
  FREE_ACTION_RESULT: 'FREE_ACTION_RESULT',
} as const;

export type QuestObjectiveType = (typeof QUEST_OBJECTIVE_TYPE)[keyof typeof QUEST_OBJECTIVE_TYPE];

export type QuestRequirement =
  | { type: 'QUEST_COMPLETED'; questId: string }
  | { type: 'FACT_KNOWN'; factId: string }
  | { type: 'RELATIONSHIP_MIN'; npcId: string; field: 'trust' | 'respect' | 'affection'; value: number }
  | { type: 'SCENE_VISITED'; sceneId: string }
  | { type: 'WORLD_FLAG'; flagId: string };

export type QuestAvailabilityTrigger = {
  type: 'DIALOGUE_TOPIC';
  npcId: string;
  topicId: string;
};

export const QUEST_CATEGORY = {
  MAIN: 'MAIN',
  SIDE: 'SIDE',
  ADVANCEMENT: 'ADVANCEMENT',
} as const;

export type QuestCategory = (typeof QUEST_CATEGORY)[keyof typeof QUEST_CATEGORY];

export interface QuestObjectiveDefinition {
  id: string;
  type: QuestObjectiveType;
  description: string;
  targetId?: string;
  requiredCount?: number;
  optional?: boolean;
  conversationTopicId?: string;
  sceneId?: string;
  requiredFactId?: string;
}

export type QuestEffect =
  | { type: 'CREATE_WORLD_FACT'; factType: string; factId?: string; tags?: string[] }
  | { type: 'RELATIONSHIP_CHANGE'; npcId: string; reason: string }
  | { type: 'UNLOCK_QUEST'; questId: string }
  | { type: 'UNLOCK_SCENE'; sceneId: string }
  | { type: 'SET_WORLD_FLAG'; flagId: string; value: boolean };

export interface QuestDefinition {
  id: QuestId;
  title: string;
  description: string;
  category?: QuestCategory;
  requesterNpcId?: NpcId;
  prerequisites?: QuestRequirement[];
  availabilityTriggers?: QuestAvailabilityTrigger[];
  objectives: QuestObjectiveDefinition[];
  completionEffects?: QuestEffect[];
  nextQuestIds?: string[];
  reward?: {
    exp?: number;
    gold?: number;
    items?: readonly { itemId: string; quantity: number }[];
  };
}

export interface QuestObjectiveProgress {
  objectiveId: string;
  currentCount: number;
  completed: boolean;
  countedIds?: readonly string[];
}

export interface QuestRuntimeState {
  questId: QuestId;
  status: QuestStatus;
  objectiveProgress: Readonly<Record<string, QuestObjectiveProgress>>;
  startedAtTurn?: number;
  completedAtTurn?: number;
}

/**
 * GameState runtime record. `id` is kept for existing save/reducer compatibility.
 * `questId` mirrors `id`.
 */
export interface QuestState extends QuestRuntimeState {
  id: QuestId;
  requesterNpcId?: NpcId;
}

export function isQuestStatus(value: string): value is QuestStatus {
  return (Object.values(QUEST_STATUS) as string[]).includes(value);
}

export function migrateQuestStatus(value: string): QuestStatus | null {
  if (isQuestStatus(value)) {
    return value;
  }
  if (value === 'inactive') {
    return QUEST_STATUS.LOCKED;
  }
  if (value === 'active') {
    return QUEST_STATUS.ACTIVE;
  }
  if (value === 'completed') {
    return QUEST_STATUS.COMPLETED;
  }
  if (value === 'failed') {
    return QUEST_STATUS.FAILED;
  }
  return null;
}

export type { SceneId };
