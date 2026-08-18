import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { PLAYER_CLASS_ID } from '../player/classes';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../npc/memory/memory-selectors';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { createMemoryStorage, createSaveService } from '../save';
import { LOCATION_ID, RUINS_GUARDIAN_FACT_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { CHOICE_LOOK_AROUND } from '../world/locations/location-story-choices';
import { CHOICE_FIGHT_GUARDIAN, CHOICE_ENTER_CLASS_WARRIOR, CHOICE_INVESTIGATE_WARRIOR, STORY_SCENE_ID } from '../story/story-scene-definitions';
import { CHOICE_REPORT_RUINS } from '../quests/quest-story-choices';
import { getAvailableChoices } from '../story/story-choice-service';
import { BOSS_ID, BOSS_INSTANCE_ID } from '../combat/boss/boss-types';
import { canSaveGame } from '../save/save-types';
import { isGameDebugEnabled } from '../debug/debug-flags';

async function startWarriorSlice() {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'NEW_GAME' });
  await orch.dispatch({ type: 'SET_PLAYER_CLASS', classId: PLAYER_CLASS_ID.WARRIOR });
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  return orch;
}

export async function runStep30VerticalSliceScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const fresh = createInitialGameState();
  if (fresh.mode === 'STORY' && fresh.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE && fresh.player.classId === PLAYER_CLASS_ID.ADVENTURER) {
    pass('A-new-game', `${fresh.story.currentSceneId} / ${fresh.player.classId}`);
  } else {
    fail('A-new-game', JSON.stringify({ mode: fresh.mode, loc: fresh.world.currentLocationId, classId: fresh.player.classId }));
  }

  const orch = await startWarriorSlice();
  const afterClass = orch.getState();
  if (afterClass.player.classId === PLAYER_CLASS_ID.WARRIOR && afterClass.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.ACTIVE) {
    pass('class-quest', `${afterClass.player.classId} / ${afterClass.quests[QUEST_ID.RUINS_MYSTERY]?.status}`);
  } else {
    fail('class-quest', JSON.stringify({ classId: afterClass.player.classId, quest: afterClass.quests[QUEST_ID.RUINS_MYSTERY]?.status }));
  }

  const storage = createMemoryStorage();
  const saveService = createSaveService(storage);
  const savedOrch = createGameOrchestrator(afterClass, undefined, { saveService });
  await savedOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });

  await savedOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await savedOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  const ruins = savedOrch.getState();
  if (ruins.world.currentLocationId === LOCATION_ID.ANCIENT_RUINS && canSaveGame(ruins)) {
    pass('F-location', ruins.world.currentLocationId);
  } else {
    fail('F-location', ruins.world.currentLocationId);
  }

  await savedOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_2' });
  await savedOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  const inCombat = savedOrch.getState();
  if (inCombat.mode === 'COMBAT' && !canSaveGame(inCombat)) {
    pass('combat-save-block', inCombat.mode);
  } else {
    fail('combat-save-block', inCombat.mode);
  }

  await savedOrch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_MIXED_01,
      outcome: 'VICTORY',
      player: { remainingHp: 90, remainingMp: 40 },
      defeatedEnemyIds: ['goblin_001', 'goblin_002', 'archer_001'],
      defeatedEnemyTypes: ['goblin', 'goblin', 'archer'],
    },
  });

  await savedOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_ENTER_CLASS_WARRIOR });
  await savedOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_WARRIOR });
  const discovered = savedOrch.getState();
  const playerKnows = doesPlayerKnowFact(discovered, RUINS_SEAL_FACT_ID);
  if (playerKnows && !doesNpcKnowFact(discovered, 'seria', RUINS_SEAL_FACT_ID)) {
    pass('I-discovery', RUINS_SEAL_FACT_ID);
  } else {
    fail('I-discovery', JSON.stringify({ playerKnows, seria: doesNpcKnowFact(discovered, 'seria', RUINS_SEAL_FACT_ID) }));
  }

  const knowOrch = await startWarriorSlice();
  await knowOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await knowOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await knowOrch.dispatch({ type: 'FREE_ACTION', turnId: knowOrch.getState().world.turn, input: '부서진 제단을 조사한다.' });
  await knowOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await knowOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await knowOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REPORT_RUINS });
  const reported = knowOrch.getState();
  if (doesNpcKnowFact(reported, 'seria', RUINS_SEAL_FACT_ID) && !doesNpcKnowFact(reported, 'leon', RUINS_SEAL_FACT_ID)) {
    pass('J-knowledge', 'seria knows, leon does not');
  } else {
    fail(
      'J-knowledge',
      JSON.stringify({
        seria: doesNpcKnowFact(reported, 'seria', RUINS_SEAL_FACT_ID),
        leon: doesNpcKnowFact(reported, 'leon', RUINS_SEAL_FACT_ID),
        scene: reported.story.currentSceneId,
      })
    );
  }

  await savedOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_LOOK_AROUND });
  const awakened = savedOrch.getState();
  const canFight = getAvailableChoices(awakened).some((choice) => choice.id === CHOICE_FIGHT_GUARDIAN);
  await savedOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_FIGHT_GUARDIAN });
  await savedOrch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_BOSS_01,
      outcome: 'VICTORY',
      player: { remainingHp: 70, remainingMp: 30 },
      defeatedEnemyIds: [BOSS_INSTANCE_ID.RUINS_GUARDIAN],
      defeatedEnemyTypes: [BOSS_ID.RUINS_GUARDIAN],
    },
  });
  const afterBoss = savedOrch.getState();
  if (
    canFight &&
    afterBoss.mode === 'STORY' &&
    afterBoss.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED] &&
    doesPlayerKnowFact(afterBoss, RUINS_GUARDIAN_FACT_ID) &&
    afterBoss.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY
  ) {
    pass('K-boss-victory', afterBoss.story.currentSceneId);
  } else {
    fail(
      'K-boss-victory',
      JSON.stringify({
        canFight,
        mode: afterBoss.mode,
        flag: afterBoss.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED],
        scene: afterBoss.story.currentSceneId,
      })
    );
  }

  await savedOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_3' });
  const loaded = createGameOrchestrator(createInitialGameState(), undefined, { saveService });
  await loaded.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const villageLoad = loaded.getState();
  await loaded.dispatch({ type: 'LOAD_GAME', slotId: 'slot_3' });
  const bossLoad = loaded.getState();
  if (
    villageLoad.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE &&
    bossLoad.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY &&
    canSaveGame(bossLoad)
  ) {
    pass('N-save-load', `${villageLoad.world.currentLocationId} → ${bossLoad.story.currentSceneId}`);
  } else {
    fail(
      'N-save-load',
      JSON.stringify({
        village: villageLoad.world.currentLocationId,
        boss: bossLoad.story.currentSceneId,
      })
    );
  }

  const memories = getMemoriesForNpc(reported, 'seria');
  if (memories.length === 0 || memories.every((memory) => memory.npcId === 'seria')) {
    pass('memory-hidden', `count ${memories.length}`);
  } else {
    fail('memory-hidden', 'unexpected memory leak');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!isGameDebugEnabled()) {
      pass('debug-off', 'production');
    } else {
      fail('debug-off', 'debug still on');
    }
  } else {
    if (!isGameDebugEnabled()) {
      pass('debug-dev', 'hidden unless debug flag');
    } else {
      fail('debug-dev', 'debug enabled without flag');
    }
  }

  return lines;
}
