import type { SceneId } from '../../game/core/ids';
import type { GameState } from '../../game/core/game-state';
import type { Choice } from '../../game/story/choice';

export interface DirectorProposal {
  sceneId: SceneId;
  narration: string;
  choices: readonly [Choice, Choice, Choice];
}

/**
 * Generates a scene and three numbered choices.
 * Must not modify GameState; output is a proposal only.
 */
export interface AiDirector {
  proposeScene(state: Readonly<GameState>): DirectorProposal;
}
