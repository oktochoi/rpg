import { createGameOrchestrator } from '../core/orchestrator';
import { applyEvents } from '../core/reducer';
import { createInitialGameState } from '../core/initial-state';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { TEST_GOBLIN_COMBAT_ID, TEST_GOBLIN_ENEMY_ID } from '../story/test-scenes';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../npc/memory/memory-selectors';
import { createMemoryStorage, createSaveService } from '../save';
import { ITEM_ID } from '../inventory/item-definitions';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from './quest-definitions';
import { eventsForQuestProgress } from './quest-service';
import { QUEST_STATUS } from './quest-types';
import { PLAYER_CLASS_ID } from '../player/classes';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { CHOICE_INVESTIGATE_ALTAR } from '../world/locations/location-story-choices';
import type { GameOrchestrator } from '../core/orchestrator';

async function travelToRuins(orch: GameOrchestrator): Promise<GameOrchestrator> {
  const keyed = createGameOrchestrator(
    applyEvents(orch.getState(), [
      { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_KEY_ACQUIRED, value: true },
      {
        type: 'ITEM_OBTAINED',
        itemId: ITEM_ID.RUINS_OLD_KEY,
        quantity: 1,
        sourceEventId: 'test:ruins_key',
      },
      { type: 'LOCATION_DISCOVERED', locationId: LOCATION_ID.ANCIENT_RUINS },
      {
        type: 'QUEST_OBJECTIVE_PROGRESS',
        questId: QUEST_ID.RUINS_MYSTERY,
        objectiveId: 'find_key',
        currentCount: 1,
        completed: true,
      },
      { type: 'QUEST_OBJECTIVE_COMPLETED', questId: QUEST_ID.RUINS_MYSTERY, objectiveId: 'find_key' },
    ])
  );
  await keyed.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await keyed.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  return keyed;
}

async function unlockAndAccept() {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'COMPLETE_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  return orch;
}

export async function runStep22QuestScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orchA = createGameOrchestrator(createInitialGameState());
  const locked = orchA.getState().quests[QUEST_ID.RUINS_MYSTERY]?.status;
  await orchA.dispatch({ type: 'COMPLETE_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  const available = orchA.getState().quests[QUEST_ID.RUINS_MYSTERY]?.status;
  await orchA.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  const accepted = orchA.getState().quests[QUEST_ID.RUINS_MYSTERY];
  if (
    locked === QUEST_STATUS.LOCKED &&
    available === QUEST_STATUS.AVAILABLE &&
    accepted?.status === QUEST_STATUS.ACTIVE &&
    accepted.objectiveProgress.talk_seria?.completed
  ) {
    pass('A-accept', `${locked} → ${available} → ${accepted.status}`);
  } else {
    fail('A-accept', JSON.stringify({ locked, available, status: accepted?.status, talk: accepted?.objectiveProgress.talk_seria }));
  }

  const orchB = await unlockAndAccept();
  await orchB.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orchB.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_MIXED_01,
      outcome: 'VICTORY',
      player: { remainingHp: 80, remainingMp: 40 },
      defeatedEnemyIds: ['goblin_001', 'goblin_002', 'archer_001'],
      defeatedEnemyTypes: ['goblin', 'goblin', 'archer'],
    },
  });
  const mixedDone = orchB.getState().quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.win_mixed?.completed;
  const orchB2 = await unlockAndAccept();
  await orchB2.dispatch({ type: 'START_COMBAT', combatId: TEST_GOBLIN_COMBAT_ID });
  await orchB2.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: TEST_GOBLIN_COMBAT_ID,
      outcome: 'VICTORY',
      player: { remainingHp: 90 },
      defeatedEnemyIds: [TEST_GOBLIN_ENEMY_ID],
    },
  });
  const easyDone = orchB2.getState().quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.win_mixed?.completed;
  if (mixedDone && !easyDone) {
    pass('B-combat', 'mixed complete, easy ignored');
  } else {
    fail('B-combat', JSON.stringify({ mixedDone, easyDone }));
  }

  async function clearGateAndInvestigate(orch: GameOrchestrator) {
    await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE });
    if (orch.getState().mode === 'COMBAT') {
      await orch.dispatch({
        type: 'RESOLVE_COMBAT',
        result: {
          combatId: ENCOUNTER_ID.CH1_RUINS_GATE,
          outcome: 'VICTORY',
          player: { remainingHp: 80, remainingMp: 40 },
          defeatedEnemyIds: ['gate_goblin_001', 'gate_archer_001', 'gate_brute_001'],
          defeatedEnemyTypes: ['goblin', 'archer', 'goblin'],
        },
      });
    }
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_ALTAR });
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'inspect_seal_first' });
    return orch;
  }

  const orchC = await clearGateAndInvestigate(await travelToRuins(await unlockAndAccept()));
  const stateC = orchC.getState();
  const investigateDone = stateC.quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.investigate_ruins?.completed;
  const playerKnows = doesPlayerKnowFact(stateC, RUINS_SEAL_FACT_ID);
  const seriaKnowsC = doesNpcKnowFact(stateC, 'seria', RUINS_SEAL_FACT_ID);
  if (investigateDone && playerKnows && !seriaKnowsC && stateC.world.facts.some((fact) => fact.id === RUINS_SEAL_FACT_ID)) {
    pass('C-investigate', `fact ${RUINS_SEAL_FACT_ID}`);
  } else {
    fail('C-investigate', JSON.stringify({ investigateDone, playerKnows, seriaKnowsC, facts: stateC.world.facts.map((fact) => fact.id) }));
  }

  const orchD = await clearGateAndInvestigate(await travelToRuins(await unlockAndAccept()));
  const beforeShare = orchD.getState();
  const seriaBefore = doesNpcKnowFact(beforeShare, 'seria', RUINS_SEAL_FACT_ID);
  await orchD.dispatch({ type: 'SHARE_FACT', factId: RUINS_SEAL_FACT_ID, fromId: 'player', toId: 'seria' });
  const afterShare = orchD.getState();
  if (
    doesPlayerKnowFact(beforeShare, RUINS_SEAL_FACT_ID) &&
    !seriaBefore &&
    doesNpcKnowFact(afterShare, 'seria', RUINS_SEAL_FACT_ID)
  ) {
    pass('D-knowledge', 'player knows / seria unknown → seria knows');
  } else {
    fail(
      'D-knowledge',
      JSON.stringify({
        player: doesPlayerKnowFact(beforeShare, RUINS_SEAL_FACT_ID),
        seriaBefore,
        seriaAfter: doesNpcKnowFact(afterShare, 'seria', RUINS_SEAL_FACT_ID),
      })
    );
  }

  const orchE = await travelToRuins(await unlockAndAccept());
  await orchE.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orchE.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_MIXED_01,
      outcome: 'VICTORY',
      player: { remainingHp: 70, remainingMp: 40 },
      defeatedEnemyIds: ['goblin_001', 'archer_001'],
    },
  });
  await orchE.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_ALTAR });
  await orchE.dispatch({ type: 'SELECT_CHOICE', choiceId: 'inspect_seal_first' });
  await orchE.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 });
  await orchE.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_BOSS_01,
      outcome: 'VICTORY',
      player: { remainingHp: 60, remainingMp: 30 },
      defeatedEnemyIds: ['guardian_001'],
    },
  });
  await orchE.dispatch({ type: 'SHARE_FACT', factId: RUINS_SEAL_FACT_ID, fromId: 'player', toId: 'seria' });
  const stateE = orchE.getState();
  const questE = stateE.quests[QUEST_ID.RUINS_MYSTERY];
  const nextQuest = stateE.quests[QUEST_ID.KNIGHT_SUSPICION];
  const memoryE = getMemoriesForNpc(stateE, 'seria').find((memory) => memory.type === 'SHARED_EXPERIENCE');
  if (
    questE?.status === QUEST_STATUS.COMPLETED &&
    (stateE.relationships.seria.affection ?? 0) > 0 &&
    (stateE.relationships.seria.trust ?? 0) > 0 &&
    memoryE &&
    nextQuest?.status === QUEST_STATUS.LOCKED &&
    stateE.world.facts.some((fact) => fact.type === 'QUEST_COMPLETED')
  ) {
    pass('E-complete', `aff ${stateE.relationships.seria.affection} memory ${memoryE.summary}`);
  } else {
    fail(
      'E-complete',
      JSON.stringify({
        status: questE?.status,
        progress: questE?.objectiveProgress,
        aff: stateE.relationships.seria,
        memory: memoryE?.summary,
        next: nextQuest?.status,
        facts: stateE.world.facts.map((fact) => fact.type),
      })
    );
  }

  const orchF = await travelToRuins(await unlockAndAccept());
  await orchF.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orchF.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_MIXED_01,
      outcome: 'VICTORY',
      player: { remainingHp: 80 },
      defeatedEnemyIds: ['goblin_001'],
    },
  });
  const mid = orchF.getState().quests[QUEST_ID.RUINS_MYSTERY];
  const completedMid = Object.values(mid?.objectiveProgress ?? {}).filter((item) => item.completed).length;
  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(orchF.getState(), undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  await saveOrch.dispatch({ type: 'NEW_GAME' });
  await saveOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = saveOrch.getState().quests[QUEST_ID.RUINS_MYSTERY];
  const completedLoaded = Object.values(loaded?.objectiveProgress ?? {}).filter((item) => item.completed).length;
  if (completedMid >= 3 && completedLoaded === completedMid && loaded?.status === QUEST_STATUS.ACTIVE) {
    pass('F-save', `${completedLoaded} objectives restored`);
  } else {
    fail('F-save', JSON.stringify({ completedMid, completedLoaded, status: loaded?.status, progress: loaded?.objectiveProgress }));
  }

  const orchG = await unlockAndAccept();
  const won = {
    type: 'COMBAT_WON' as const,
    combatId: ENCOUNTER_ID.RUINS_MIXED_01,
    defeatedEnemyIds: ['goblin_001'],
  };
  const first = eventsForQuestProgress(orchG.getState(), [won]);
  const afterFirst = applyEvents(orchG.getState(), [won, ...first]);
  const second = eventsForQuestProgress(afterFirst, [won]);
  const completedTwice = second.some((event) => event.type === 'QUEST_OBJECTIVE_COMPLETED' && event.objectiveId === 'win_mixed');
  const firstComplete = first.some((event) => event.type === 'QUEST_OBJECTIVE_COMPLETED' && event.objectiveId === 'win_mixed');
  if (firstComplete && !completedTwice) {
    pass('G-duplicate', 'progress applied once');
  } else {
    fail('G-duplicate', JSON.stringify({ first: first.map((event) => event.type), second: second.map((event) => event.type) }));
  }

  const classState = applyEvents(createInitialGameState(), [{ type: 'PLAYER_CLASS_UPDATED', classId: PLAYER_CLASS_ID.MAGE }]);
  if (classState.player.classId === PLAYER_CLASS_ID.MAGE && classState.quests[QUEST_ID.RUINS_MYSTERY]) {
    pass('regression-class-quest', 'mage + ruins_mystery runtime');
  } else {
    fail('regression-class-quest', classState.player.classId);
  }

  return lines;
}
