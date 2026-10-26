export const STORY_FLOW_MODE = {
  STORY_LOCKED: 'STORY_LOCKED',
  FREE_ROAM: 'FREE_ROAM',
} as const;

export type StoryFlowMode = (typeof STORY_FLOW_MODE)[keyof typeof STORY_FLOW_MODE];

/** Player-facing play mode: combat overlays story flow. */
export type PlayMode = StoryFlowMode | 'COMBAT';

export const STORY_LOG_ENTRY_TYPE = {
  NARRATION: 'narration',
  DIALOGUE: 'dialogue',
  CHOICE: 'choice',
  SYSTEM: 'system',
} as const;

export type StoryLogEntry =
  | {
      type: 'narration';
      text: string;
      sceneId?: string;
      id: string;
    }
  | {
      type: 'dialogue';
      speaker: string;
      text: string;
      id: string;
    }
  | {
      type: 'choice';
      text: string;
      id: string;
    }
  | {
      type: 'system';
      text: string;
      id: string;
    };

export interface StorySequenceDefinition {
  id: string;
  title: string;
  /** Scenes that belong to this sequence (lock while current). */
  sceneIds: readonly string[];
  /** Entering these scenes starts (or re-locks) the sequence. */
  startSceneIds: readonly string[];
  /** Visiting these scenes completes the sequence and unlocks FREE_ROAM. */
  completeSceneIds: readonly string[];
  /** After complete, remaining in these hub scenes stays FREE_ROAM. */
  roamHubSceneIds?: readonly string[];
}

export const MAX_STORY_LOG_ENTRIES = 80;
