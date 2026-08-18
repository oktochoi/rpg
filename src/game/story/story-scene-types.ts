import type { SceneId } from '../core/ids';
import type { NPCMemoryType } from '../npc/memory/memory-types';
import type { QuestStatus } from '../quests/quest-types';

export type StoryConditionAtom =
  | { type: 'QUEST_STATUS'; questId: string; status: QuestStatus }
  | { type: 'QUEST_OBJECTIVE_COMPLETED'; questId: string; objectiveId: string }
  | { type: 'FACT_EXISTS'; factId: string }
  | { type: 'PLAYER_KNOWS_FACT'; factId: string }
  | { type: 'NPC_KNOWS_FACT'; npcId: string; factId: string }
  | { type: 'RELATIONSHIP_MIN'; npcId: string; field: 'trust' | 'respect' | 'affection' | 'fear'; value: number }
  | { type: 'RELATIONSHIP_MAX'; npcId: string; field: 'trust' | 'respect' | 'affection' | 'fear'; value: number }
  | { type: 'MEMORY_EXISTS'; npcId: string; memoryType: NPCMemoryType }
  | { type: 'PLAYER_CLASS'; classId: string }
  | { type: 'CURRENT_LOCATION'; locationId: string }
  | { type: 'WORLD_FLAG'; flagId: string; value?: boolean }
  | { type: 'SCENE_VISITED'; sceneId: string }
  | { type: 'SCENE_NOT_VISITED'; sceneId: string }
  | { type: 'NPC_PRESENT'; npcId: string }
  | { type: 'DAY_MIN'; day: number }
  | { type: 'CHAPTER_COMPLETED'; chapterId: string }
  | { type: 'PLAYER_LEVEL_MIN'; level: number }
  | { type: 'LOCATION_DISCOVERED'; locationId: string };

export type StoryCondition =
  | StoryConditionAtom
  | { allOf: readonly StoryCondition[] }
  | { anyOf: readonly StoryCondition[] }
  | { noneOf: readonly StoryCondition[] };

export type StoryChoiceAction =
  | { type: 'MOVE_TO_LOCATION'; locationId: string }
  | { type: 'START_COMBAT'; combatId: string }
  | { type: 'SHARE_FACT'; factId: string; toId: string }
  | { type: 'ACCEPT_QUEST'; questId: string }
  | { type: 'INVESTIGATE'; targetId?: string }
  | { type: 'TALK'; promptId?: string }
  | { type: 'LOOK_AROUND' }
  | { type: 'REST' }
  | { type: 'ENTER_SCENE'; sceneId: string }
  | { type: 'PASS_GATE' }
  | { type: 'OPEN_SHOP' }
  | { type: 'CHOOSE_CLASS_PATH'; classId: string }
  | { type: 'ACCEPT_SIDE_QUEST'; questId: string }
  | { type: 'LEARN_FACT'; factId: string }
  | { type: 'CONTINUE'; nextSceneId?: string };

export type StorySceneEffect =
  | { type: 'SET_WORLD_FLAG'; flagId: string; value: boolean }
  | { type: 'DISCOVER_LOCATION'; locationId: string }
  | { type: 'GRANT_ITEM'; itemId: string; quantity: number; sourceEventId: string }
  | { type: 'LEARN_FACT'; factId: string };

export type StorySceneActivation = 'auto' | 'on_talk';

export type StoryChoicePurpose = 'PROGRESSION' | 'ROLEPLAY' | 'DECISION';

export interface StoryChoiceDefinition {
  id: string;
  text: string;
  conditions?: StoryCondition;
  action: StoryChoiceAction;
  nextSceneId?: string;
  choicePurpose?: StoryChoicePurpose;
}

export interface StorySceneDefinition {
  id: SceneId;
  locationId: string;
  title?: string;
  narrative: string;
  npcId?: string;
  npcDialogue?: string;
  entryConditions: StoryCondition;
  choices: readonly StoryChoiceDefinition[];
  tags?: readonly string[];
  priority?: number;
  fallbackSceneId?: string;
  activation?: StorySceneActivation;
  onEnter?: readonly StorySceneEffect[];
  autoContinue?: boolean;
  continueTo?: string;
  requiresPlayerAction?: boolean;
  isDecisionPoint?: boolean;
}

export interface StorySceneRuntimeState {
  currentSceneId: SceneId;
  visitedSceneIds: readonly string[];
  sceneVisitCount: Readonly<Record<string, number>>;
  previousSceneId?: SceneId;
  enteredAtTurn?: number;
}

export interface StoryResolveContext {
  incoming?: readonly { type: string }[];
}
