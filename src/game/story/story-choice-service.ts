import type { Choice } from './choice';
import type { GameState } from '../core/game-state';
import { storyChoicesForLocation } from '../world/locations/location-story-choices';
import { evaluateStoryCondition } from './story-conditions';
import { getStorySceneDefinition } from './story-scene-definitions';
import type { StoryChoiceDefinition } from './story-scene-types';

function asTriple(choices: Choice[]): readonly [Choice, Choice, Choice] {
  return [choices[0], choices[1], choices[2]];
}

export function getAvailableChoiceDefinitions(
  state: Readonly<GameState>,
  sceneId: string = state.story.currentSceneId
): StoryChoiceDefinition[] {
  const scene = getStorySceneDefinition(sceneId);
  if (!scene) {
    return [];
  }
  return scene.choices.filter((choice) => evaluateStoryCondition(state, choice.conditions));
}

export function getAvailableChoices(
  state: Readonly<GameState>,
  sceneId: string = state.story.currentSceneId
): readonly [Choice, Choice, Choice] {
  const fromScene = getAvailableChoiceDefinitions(state, sceneId).slice(0, 3).map((choice) => ({
    id: choice.id,
    label: choice.text,
  }));
  if (fromScene.length >= 3) {
    return asTriple(fromScene);
  }
  const merged = [...fromScene];
  for (const choice of storyChoicesForLocation(state)) {
    if (merged.length >= 3) {
      break;
    }
    if (!merged.some((item) => item.id === choice.id)) {
      merged.push(choice);
    }
  }
  while (merged.length < 3) {
    merged.push({ id: `story_wait_${merged.length}`, label: '잠시 주변을 살핀다' });
  }
  return asTriple(merged);
}

export function findAvailableChoiceDefinition(
  state: Readonly<GameState>,
  choiceId: string
): StoryChoiceDefinition | null {
  return getAvailableChoiceDefinitions(state).find((choice) => choice.id === choiceId) ?? null;
}
