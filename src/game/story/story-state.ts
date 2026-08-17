import type { SceneId } from '../core/ids';
import type { Choice } from './choice';

export interface StoryState {
  currentSceneId: SceneId;
  narration: string;
  choices: readonly Choice[];
}
