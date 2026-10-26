import { createInitialGameState } from '../core/initial-state';
import { createGameOrchestrator } from '../core/orchestrator';
import { allStorySceneDefinitions, STORY_SCENE_ID } from './story-scene-definitions';
import type { StoryCondition } from './story-scene-types';

function flattenAtoms(condition: StoryCondition | undefined, acc: StoryCondition[] = []): StoryCondition[] {
  if (!condition) {
    return acc;
  }
  if ('allOf' in condition) {
    condition.allOf.forEach((item) => flattenAtoms(item, acc));
    return acc;
  }
  if ('anyOf' in condition) {
    condition.anyOf.forEach((item) => flattenAtoms(item, acc));
    return acc;
  }
  if ('noneOf' in condition) {
    condition.noneOf.forEach((item) => flattenAtoms(item, acc));
    return acc;
  }
  acc.push(condition);
  return acc;
}

export async function runStoryDeadlockScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const deadlocks: string[] = [];
  for (const scene of allStorySceneDefinitions()) {
    const atoms = flattenAtoms(scene.entryConditions);
    const visitedSelf = atoms.some(
      (atom) => 'type' in atom && atom.type === 'SCENE_VISITED' && atom.sceneId === scene.id
    );
    const notVisitedSelf = atoms.some(
      (atom) => 'type' in atom && atom.type === 'SCENE_NOT_VISITED' && atom.sceneId === scene.id
    );
    if (visitedSelf && notVisitedSelf) {
      deadlocks.push(scene.id);
    }
  }
  if (deadlocks.length === 0) {
    pass('deadlock-self-visit', 'no SCENE_VISITED + SCENE_NOT_VISITED on self');
  } else {
    fail('deadlock-self-visit', deadlocks.join(','));
  }

  const orch = createGameOrchestrator(createInitialGameState());
  const intro = orch.getState().story.currentSceneId;
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'intro_continue' });
  const squareChoice = orch.getState().story.choices.some((choice) => choice.id === 'hub_square_again');
  if (squareChoice) {
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'hub_square_again' });
  }
  const visitedSquare = (orch.getState().story.visitedSceneIds ?? []).includes(STORY_SCENE_ID.LUEN_SQUARE_LOOK);
  const secondSquare = orch.getState().story.choices.some((choice) => choice.id === 'hub_square_again');
  if (intro === STORY_SCENE_ID.LUEN_VILLAGE_INTRO && squareChoice && visitedSquare && !secondSquare) {
    pass('square-look-once', STORY_SCENE_ID.LUEN_SQUARE_LOOK);
  } else {
    fail('square-look-once', JSON.stringify({ intro, squareChoice, visitedSquare, secondSquare }));
  }

  return lines;
}
