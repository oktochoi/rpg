import type { GameEvent } from '../../game/core/event';
import type { LocationContext } from '../../game/world/locations/location-types';
import type { NPCMemoryType } from '../../game/npc/memory/memory-types';
import type { RelationshipState } from '../../game/npc/relationship';
import type { QuestStatus } from '../../game/quests/quest-types';
import type { WorldFact } from '../../game/world/facts/world-fact';
import type { ChoiceCandidate, DynamicChoice } from '../../game/story/choices/choice-types';

export interface DirectorNpcContext {
  npcId: string;
  name: string;
  role: string;
  relationship: RelationshipState;
  relevantKnownFactIds: string[];
  relevantMemoryTypes: NPCMemoryType[];
  currentGoal?: string;
}

export interface DirectorQuestContext {
  questId: string;
  title: string;
  status: QuestStatus;
  currentObjectiveIds: string[];
  currentObjectiveDescriptions: string[];
}

export interface StoryDirectorContext {
  turnId: number;
  currentSceneId: string;
  currentLocation: LocationContext;
  player: {
    classId: string;
    name?: string;
    level?: number;
    classDisplay?: string;
    rank?: string;
    currentHp: number;
    maxHp: number;
    currentMp: number;
    maxMp: number;
  };
  presentNpcs: DirectorNpcContext[];
  relevantQuests: DirectorQuestContext[];
  relevantPlayerKnownFacts: WorldFact[];
  relevantWorldFlags: string[];
  availableExplorationPoints: string[];
  availableEncounterIds: string[];
  day?: number;
  hour?: number;
  minute?: number;
  timeOfDay?: string;
  clock?: string;
  chapterTitle?: string;
  mainObjective?: string;
  recentImportantEvents?: GameEvent[];
}

export interface DirectorChoiceResponse {
  turnId: number;
  choices: DynamicChoice[];
  debugReason?: string;
}

export interface DirectorDebugEntry {
  id: string;
  source: string;
  priority: number;
  critical: boolean;
  text: string;
  excludedReason?: string;
}

export interface DirectorDebugSnapshot {
  currentSceneId: string;
  turnId: number;
  candidateCount: number;
  candidates: DirectorDebugEntry[];
  selectedIds: string[];
  excluded: DirectorDebugEntry[];
}

export interface StoryDirector {
  generateChoices(
    context: StoryDirectorContext,
    candidates: ChoiceCandidate[]
  ): Promise<DirectorChoiceResponse>;
}

export function isStaleDirectorResponse(
  currentTurnId: number,
  response: Pick<DirectorChoiceResponse, 'turnId'>
): boolean {
  return response.turnId !== currentTurnId;
}
