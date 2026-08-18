import { createGameOrchestrator } from '../core/orchestrator';
import { applyEvents } from '../core/reducer';
import { createInitialGameState } from '../core/initial-state';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { TEST_GOBLIN_COMBAT_ID, TEST_GOBLIN_ENEMY_ID } from '../story/test-scenes';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../npc/memory/memory-selectors';
import { createMemoryStorage, createSaveService } from '../save';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from './quest-definitions';
import { eventsForQuestProgress } from './quest-service';
import { QUEST_STATUS } from './quest-types';
import { PLAYER_CLASS_ID } from '../player/classes';
import { LOCATION_ID } from '../world/locations/location-definitions';
import type { GameOrchestrator } from '../core/orchestrator';

async function travelToRuins(orch: GameOrchestrator) {
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
}

async function unlockAndAccept() {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  return orch;
}

export async function runStep22QuestScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orchA = createGameOrchestrator(createInitialGameState());
  const locked = orchA.getState().quests[QUEST_ID.RUINS_MYSTERY]?.status;
  await orchA.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  const available = orchA.getState().quests[QUEST_ID.RUINS_MYSTERY]?.status;
  await orchA.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  const accepted = orchA.getState().quests[QUEST_ID.RUINS_MYSTERY];
  if (
    locked === QUEST_STATUS.LOCKED &&
    available === QUEST_STATUS.AVAILABLE &&
    accepted?.status === QUEST_STATUS.ACTIVE &&
    accepted.objectiveProgress.talk_seria
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

  const orchC = await unlockAndAccept();
  await travelToRuins(orchC);
  await orchC.dispatch({ type: 'FREE_ACTION', turnId: orchC.getState().world.turn, input: '폐허 내부를 자세히 조사한다.' });
  const stateC = orchC.getState();
  const investigateDone = stateC.quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.investigate_ruins?.completed;
  const playerKnows = doesPlayerKnowFact(stateC, RUINS_SEAL_FACT_ID);
  const seriaKnowsC = doesNpcKnowFact(stateC, 'seria', RUINS_SEAL_FACT_ID);
  if (investigateDone && playerKnows && !seriaKnowsC && stateC.world.facts.some((fact) => fact.id === RUINS_SEAL_FACT_ID)) {
    pass('C-investigate', `fact ${RUINS_SEAL_FACT_ID}`);
  } else {
    fail('C-investigate', JSON.stringify({ investigateDone, playerKnows, seriaKnowsC, facts: stateC.world.facts.map((fact) => fact.id) }));
  }

  const orchD = await unlockAndAccept();
  await travelToRuins(orchD);
  await orchD.dispatch({ type: 'FREE_ACTION', turnId: orchD.getState().world.turn, input: '폐허 내부를 자세히 조사한다.' });
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

  const orchE = await unlockAndAccept();
  await travelToRuins(orchE);
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
  const turnAfterCombat = orchE.getState().world.turn;
  await orchE.dispatch({ type: 'FREE_ACTION', turnId: turnAfterCombat, input: '폐허 내부를 자세히 조사한다.' });
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
    nextQuest?.status === QUEST_STATUS.AVAILABLE &&
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

  const orchF = await unlockAndAccept();
  await travelToRuins(orchF);
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
    pass('F-save', `${completedLoaded} / 5 restored`);
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
