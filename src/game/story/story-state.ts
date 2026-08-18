import type { NpcId, SceneId } from '../core/ids';
import type { Choice } from './choice';
import { CHAPTER_ID } from './chapters/chapter-types';

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
  };
}
