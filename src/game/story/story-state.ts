import type { NpcId, SceneId } from '../core/ids';
import type { Choice } from './choice';
import { CHAPTER_ID } from './chapters/chapter-types';
import {
  STORY_FLOW_MODE,
  type StoryFlowMode,
  type StoryLogEntry,
} from './sequences/story-sequence-types';
import { STORY_SEQUENCE_ID } from './sequences/chapter1-sequences';

export type DialogueSpeaker = 'PLAYER' | 'NPC';

export interface DialogueMessage {
  speaker: DialogueSpeaker;
  text: string;
}

export const MAX_DIALOGUE_MESSAGES = 8;

export interface StoryState {
  currentSceneId: SceneId;
  currentNpcId: NpcId | null;
  narration: string;
  lastActionNarrative: string | null;
  choices: readonly Choice[];
  dialogue: readonly DialogueMessage[];
  visitedSceneIds: readonly string[];
  sceneVisitCount: Readonly<Record<string, number>>;
  previousSceneId?: SceneId;
  enteredAtTurn?: number;
  flags: Readonly<Record<string, boolean>>;
  currentChapterId: string;
  completedChapterIds: readonly string[];
  consumedTopicIds: readonly string[];
  recentSemanticKeys: readonly string[];
  lastActionStateHash?: string;
  /** STORY_LOCKED while a Sequence runs; FREE_ROAM between sequences. */
  flowMode: StoryFlowMode;
  currentSequenceId: string | null;
  completedSequenceIds: readonly string[];
  storyLog: readonly StoryLogEntry[];
}

export function emptyStoryVisitState(sceneId: SceneId): Pick<
  StoryState,
  | 'visitedSceneIds'
  | 'sceneVisitCount'
  | 'previousSceneId'
  | 'enteredAtTurn'
  | 'flags'
  | 'currentChapterId'
  | 'completedChapterIds'
  | 'consumedTopicIds'
  | 'recentSemanticKeys'
  | 'flowMode'
  | 'currentSequenceId'
  | 'completedSequenceIds'
  | 'storyLog'
> {
  return {
    visitedSceneIds: [sceneId],
    sceneVisitCount: { [sceneId]: 1 },
    previousSceneId: undefined,
    enteredAtTurn: 1,
    flags: {},
    currentChapterId: CHAPTER_ID.CHAPTER_1_LUEN_RUINS,
    completedChapterIds: [],
    consumedTopicIds: [],
    recentSemanticKeys: [],
    flowMode: STORY_FLOW_MODE.STORY_LOCKED,
    currentSequenceId: STORY_SEQUENCE_ID.LUEN_ARRIVAL,
    completedSequenceIds: [],
    storyLog: [],
  };
}
