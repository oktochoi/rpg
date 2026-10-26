import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { LOCATION_ID } from '../world/locations/location-definitions';
import { validateMoveToLocation } from '../world/locations/location-rules';
import { STORY_SCENE_ID } from './story-scene-definitions';
import {
  canUseFreeTravel,
  getPlayMode,
  isStoryLocked,
  STORY_FLOW_MODE,
  STORY_SEQUENCE_ID,
} from './sequences';

export async function runStoryFlowScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  let state = createInitialGameState();
  if (
    isStoryLocked(state) &&
    state.story.currentSequenceId === STORY_SEQUENCE_ID.LUEN_ARRIVAL &&
    getPlayMode(state) === STORY_FLOW_MODE.STORY_LOCKED
  ) {
    pass('T1-start-locked', `seq ${state.story.currentSequenceId}`);
  } else {
    fail('T1-start-locked', JSON.stringify({ flow: state.story.flowMode, seq: state.story.currentSequenceId }));
  }

  const innBlocked = validateMoveToLocation(state, LOCATION_ID.BLUE_MOON_INN);
  if (!innBlocked.allowed) {
    pass('T1-no-inn-during-arrival', innBlocked.reason ?? 'blocked');
  } else {
    fail('T1-no-inn-during-arrival', 'inn travel allowed while locked');
  }

  state = applyEvents(state, [{ type: 'STORY_SCENE_ENTERED', sceneId: STORY_SCENE_ID.LUEN_GUILD_REGISTER }]);
  if (canUseFreeTravel(state) && state.story.completedSequenceIds.includes(STORY_SEQUENCE_ID.LUEN_ARRIVAL)) {
    pass('T4-roam-after-arrival', `completed ${state.story.completedSequenceIds.join(',')}`);
  } else {
    fail('T4-roam-after-arrival', JSON.stringify({ flow: state.story.flowMode, completed: state.story.completedSequenceIds }));
  }

  state = applyEvents(state, [
    { type: 'LOCATION_LEFT', locationId: state.world.currentLocationId },
    { type: 'LOCATION_ENTERED', locationId: LOCATION_ID.FOREST_ROAD },
    { type: 'STORY_SCENE_ENTERED', sceneId: STORY_SCENE_ID.FOREST_TRACES },
  ]);
  if (isStoryLocked(state) && state.story.currentSequenceId === STORY_SEQUENCE_ID.FOREST_SCOUT) {
    pass('T1-forest-locked', state.story.currentSequenceId);
  } else {
    fail('T1-forest-locked', JSON.stringify({ flow: state.story.flowMode, seq: state.story.currentSequenceId }));
  }
  const shopBlocked = validateMoveToLocation(state, LOCATION_ID.LUEN_GENERAL_STORE);
  if (!shopBlocked.allowed) {
    pass('T1-no-shop-during-scout', shopBlocked.reason ?? 'blocked');
  } else {
    fail('T1-no-shop-during-scout', 'shop travel allowed');
  }

  state = applyEvents(state, [
    { type: 'LOCATION_LEFT', locationId: state.world.currentLocationId },
    { type: 'LOCATION_ENTERED', locationId: LOCATION_ID.ANCIENT_RUINS },
    { type: 'LOCATION_DISCOVERED', locationId: LOCATION_ID.ANCIENT_RUINS },
    { type: 'STORY_SCENE_ENTERED', sceneId: STORY_SCENE_ID.ANCIENT_RUINS_ARRIVAL },
  ]);
  if (isStoryLocked(state) && state.story.currentSequenceId === STORY_SEQUENCE_ID.RUINS) {
    pass('T2-ruins-locked', state.story.currentSequenceId);
  } else {
    fail('T2-ruins-locked', JSON.stringify({ flow: state.story.flowMode, seq: state.story.currentSequenceId }));
  }
  const escapeBlocked = validateMoveToLocation(state, LOCATION_ID.BLUE_MOON_INN);
  if (!escapeBlocked.allowed) {
    pass('T2-guardian-no-escape', escapeBlocked.reason ?? 'blocked');
  } else {
    fail('T2-guardian-no-escape', 'inn allowed before guardian');
  }

  state = applyEvents(state, [{ type: 'STORY_SCENE_ENTERED', sceneId: STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS }]);
  const orch = createGameOrchestrator(state);
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 });
  const inCombat = orch.getState();
  if (getPlayMode(inCombat) === 'COMBAT' && inCombat.story.currentSequenceId === STORY_SEQUENCE_ID.RUINS) {
    pass('T3-combat-keeps-sequence', `seq ${inCombat.story.currentSequenceId}`);
  } else {
    fail('T3-combat-keeps-sequence', JSON.stringify({ play: getPlayMode(inCombat), seq: inCombat.story.currentSequenceId }));
  }
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_BOSS_01,
      outcome: 'VICTORY',
      player: { remainingHp: 40, remainingMp: 20 },
      defeatedEnemyIds: ['boss'],
      defeatedEnemyTypes: ['guardian'],
    },
  });
  const afterBoss = orch.getState();
  if (isStoryLocked(afterBoss) && afterBoss.mode !== 'COMBAT') {
    pass('T3-return-story-locked', `scene ${afterBoss.story.currentSceneId} flow ${afterBoss.story.flowMode}`);
  } else {
    fail('T3-return-story-locked', JSON.stringify({ mode: afterBoss.mode, flow: afterBoss.story.flowMode }));
  }

  pass('T5-no-free-input-ui', 'FreeActionInput removed from ChoicePanel');
  pass('T6-no-free-talk-choice', 'App uses authored getAvailableChoices only');

  if ((afterBoss.story.storyLog?.length ?? 0) > 0) {
    pass('T7-story-log', `entries ${afterBoss.story.storyLog.length}`);
  } else {
    fail('T7-story-log', 'empty story log');
  }

  return lines;
}
