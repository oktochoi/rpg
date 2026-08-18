import type { GameState } from '../core/game-state';
import { getAvailableChoices } from './story-choice-service';
import { getCurrentScene, getAvailableScenes, canEnterScene } from './story-scene-resolver';
import { getStorySceneDefinition } from './story-scene-definitions';
import { getStoryScene } from './test-scenes';

export function getCurrentSceneId(state: Readonly<GameState>): string {
  return state.story.currentSceneId;
}

export function getVisitedSceneIds(state: Readonly<GameState>): readonly string[] {
  return state.story.visitedSceneIds ?? [];
}

export function getSceneVisitCount(state: Readonly<GameState>, sceneId: string): number {
  return state.story.sceneVisitCount?.[sceneId] ?? 0;
}

export function hasVisitedScene(state: Readonly<GameState>, sceneId: string): boolean {
  return getVisitedSceneIds(state).includes(sceneId);
}

export {
  getAvailableChoices,
  getCurrentScene,
  getAvailableScenes,
  canEnterScene,
  getStorySceneDefinition,
  getStoryScene,
};
