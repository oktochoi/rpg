import type { NpcId, SceneId } from '../core/ids';
import type { NpcKnowledgeEntry } from './npc-knowledge';
import type { NPCMemory } from './memory/memory-types';
import type { NpcProfile } from './npc-profile';
import type { RelationshipState } from './relationship';
import type { WorldFact } from '../world/facts/world-fact';
import type { QuestState } from '../quests/quest-types';
import type { DialogueMessage } from '../story/story-state';

/**
 * Dialogue-only snapshot. Must not include the full GameState or all WorldFacts.
 * knownFacts must come from getKnownFactsForNpc.
 * relevantMemories must come from getRelevantMemoriesForNpc — never the full memory list.
 */
export interface NpcDialogueContext {
  npc: NpcProfile;
  relationship: RelationshipState;
  knownFacts: WorldFact[];
  knowledgeEntries: readonly NpcKnowledgeEntry[];
  relevantMemories: readonly NPCMemory[];
  currentLocationId: string;
  currentSceneId?: SceneId;
  currentNpcId: NpcId;
  playerInput?: string;
  recentDialogue?: readonly DialogueMessage[];
  activeQuestIds: readonly string[];
  completedQuestIds: readonly string[];
  relevantQuestStates: readonly QuestState[];
  playerName: string;
  playerLevel: number;
  playerClassDisplay: string;
  playerRank?: string;
  day: number;
  hour?: number;
  minute?: number;
  timeOfDay?: string;
  clock?: string;
  currentChapterTitle?: string;
  currentMainObjective?: string;
}
