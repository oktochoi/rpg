import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { createMemoryStorage, createSaveService } from '../save';
import { ITEM_ID } from '../inventory/item-definitions';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../quests/quest-definitions';
import { LOCATION_ID, WORLD_FLAG } from './locations/location-definitions';
import { getCurrentLocationNpcs, getNpcsAtLocation } from './locations/location-selectors';
import { EXPLORATION_POINT_ID } from './exploration/exploration-definitions';

function grantRuinsKey(state: ReturnType<typeof createInitialGameState>) {
  return applyEvents(state, [
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_KEY_ACQUIRED, value: true },
    {
      type: 'ITEM_OBTAINED',
      itemId: ITEM_ID.RUINS_OLD_KEY,
      quantity: 1,
      sourceEventId: `test:location:ruins_key:${state.world.turn}`,
    },
  ]);
}

async function enterRuinsFromVillage(orch: ReturnType<typeof createGameOrchestrator>) {
  await orch.dispatch({ type: 'COMPLETE_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  const keyed = createGameOrchestrator(grantRuinsKey(orch.getState()));
  await keyed.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await keyed.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  return keyed;
}

async function discoverRuins() {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  return orch;
}

export async function runStep23LocationScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orchA = createGameOrchestrator(createInitialGameState());
  const fromA = orchA.getState().world.currentLocationId;
  await orchA.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '여관으로 간다.' });
  const stateA = orchA.getState();
  if (
    fromA === LOCATION_ID.LUEN_VILLAGE &&
    stateA.world.currentLocationId === LOCATION_ID.BLUE_MOON_INN &&
    stateA.world.locations[LOCATION_ID.BLUE_MOON_INN]?.visited === true &&
    stateA.lastActionResolution?.actionType === 'MOVE' &&
    stateA.lastActionResolution.success
  ) {
    pass('A-inn', `${fromA} → ${stateA.world.currentLocationId}`);
  } else {
    fail('A-inn', JSON.stringify({ fromA, now: stateA.world.currentLocationId, action: stateA.lastActionResolution }));
  }

  const orchB = createGameOrchestrator(createInitialGameState());
  await orchB.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '폐허로 간다.' });
  const stateB = orchB.getState();
  if (
    stateB.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE &&
    !stateB.lastActionResolution?.success &&
    /알지 못|바로 갈 수는|석문|열쇠/.test(stateB.story.lastActionNarrative ?? stateB.lastActionResolution?.narrative ?? '')
  ) {
    pass('B-blocked-ruins', stateB.story.lastActionNarrative ?? '');
  } else {
    fail('B-blocked-ruins', JSON.stringify({ loc: stateB.world.currentLocationId, res: stateB.lastActionResolution, narr: stateB.story.lastActionNarrative }));
  }

  const orchC = await enterRuinsFromVillage(await discoverRuins());
  const stateC = orchC.getState();
  const visitDone = stateC.quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.visit_ruins?.completed;
  if (
    stateC.world.currentLocationId === LOCATION_ID.ANCIENT_RUINS &&
    visitDone &&
    stateC.world.locations[LOCATION_ID.FOREST_ROAD]?.visited &&
    stateC.world.locations[LOCATION_ID.ANCIENT_RUINS]?.visited
  ) {
    pass('C-path-visit', 'village → forest → ruins');
  } else {
    fail('C-path-visit', JSON.stringify({ loc: stateC.world.currentLocationId, visitDone, progress: stateC.quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress }));
  }

  const orchD = createGameOrchestrator(createInitialGameState());
  const villageNpcs = getCurrentLocationNpcs(orchD.getState()).map((npc) => npc.id);
  const martaInVillage = getNpcsAtLocation(orchD.getState(), LOCATION_ID.LUEN_VILLAGE).some((npc) => npc.id === 'innkeeper');
  await orchD.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN });
  const innNpcs = getCurrentLocationNpcs(orchD.getState()).map((npc) => npc.id);
  await orchD.dispatch({ type: 'START_DIALOGUE', npcId: 'seria' });
  const seriaTalk = orchD.getState().mode !== 'DIALOGUE' && orchD.getState().world.currentLocationId === LOCATION_ID.BLUE_MOON_INN;
  await orchD.dispatch({ type: 'FREE_ACTION', turnId: orchD.getState().world.turn, input: '세리아에게 말을 건다.' });
  const seriaAskFailed = !orchD.getState().lastActionResolution?.success;
  if (
    villageNpcs.includes('seria') &&
    !martaInVillage &&
    innNpcs.includes('innkeeper') &&
    !innNpcs.includes('seria') &&
    seriaTalk &&
    seriaAskFailed
  ) {
    pass('D-npc-presence', `village ${villageNpcs.join(',')} inn ${innNpcs.join(',')}`);
  } else {
    fail('D-npc-presence', JSON.stringify({ villageNpcs, martaInVillage, innNpcs, seriaTalk, seriaAskFailed, res: orchD.getState().lastActionResolution }));
  }

  const orchE = await enterRuinsFromVillage(await discoverRuins());
  await orchE.dispatch({ type: 'FREE_ACTION', turnId: orchE.getState().world.turn, input: '부서진 제단을 조사한다.' });
  const stateE = orchE.getState();
  if (
    doesPlayerKnowFact(stateE, RUINS_SEAL_FACT_ID) &&
    !doesNpcKnowFact(stateE, 'seria', RUINS_SEAL_FACT_ID) &&
    stateE.npcs.seria.locationId === LOCATION_ID.LUEN_VILLAGE
  ) {
    pass('E-solo-fact', 'player knows / seria unknown');
  } else {
    fail('E-solo-fact', JSON.stringify({ player: doesPlayerKnowFact(stateE, RUINS_SEAL_FACT_ID), seria: doesNpcKnowFact(stateE, 'seria', RUINS_SEAL_FACT_ID), seriaLoc: stateE.npcs.seria.locationId }));
  }

  let orchF = await discoverRuins();
  await orchF.dispatch({ type: 'COMPLETE_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await orchF.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orchF.dispatch({ type: 'MOVE_NPC', npcId: 'seria', locationId: LOCATION_ID.ANCIENT_RUINS });
  orchF = createGameOrchestrator(grantRuinsKey(orchF.getState()));
  await orchF.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orchF.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await orchF.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orchF.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_MIXED_01,
      outcome: 'VICTORY',
      player: { remainingHp: 80, remainingMp: 40 },
      defeatedEnemyIds: ['goblin_001', 'goblin_002', 'archer_001'],
      defeatedEnemyTypes: ['goblin', 'goblin', 'archer'],
    },
  });
  const stateF = orchF.getState();
  const wonFact = stateF.world.facts.find((fact) => fact.type === 'COMBAT_WON' && fact.payload?.combatId === ENCOUNTER_ID.RUINS_MIXED_01);
  const seriaKnowsF = wonFact ? doesNpcKnowFact(stateF, 'seria', wonFact.id) : false;
  const leonKnowsF = wonFact ? doesNpcKnowFact(stateF, 'leon', wonFact.id) : false;
  if (doesPlayerKnowFact(stateF, wonFact?.id ?? '') && seriaKnowsF && !leonKnowsF && stateF.npcs.leon.locationId === LOCATION_ID.NORTHERN_GATE) {
    pass('F-witness', `seria ${seriaKnowsF} leon ${leonKnowsF}`);
  } else {
    fail('F-witness', JSON.stringify({ wonFact: wonFact?.id, seriaKnowsF, leonKnowsF, witnesses: wonFact?.witnessIds, seriaLoc: stateF.npcs.seria.locationId }));
  }

  let orchG = await enterRuinsFromVillage(await discoverRuins());
  await orchG.dispatch({ type: 'FREE_ACTION', turnId: orchG.getState().world.turn, input: '부서진 제단을 조사한다.' });
  const afterFirst = orchG.getState();
  const factCount = afterFirst.world.facts.filter((fact) => fact.id === RUINS_SEAL_FACT_ID).length;
  await orchG.dispatch({ type: 'FREE_ACTION', turnId: orchG.getState().world.turn, input: '부서진 제단을 조사한다.' });
  const afterSecond = orchG.getState();
  const factCount2 = afterSecond.world.facts.filter((fact) => fact.id === RUINS_SEAL_FACT_ID).length;
  const explored = afterSecond.world.exploredPointIds.includes(EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE);
  if (factCount === 1 && factCount2 === 1 && explored && /이미 살펴본/.test(afterSecond.lastActionResolution?.narrative ?? '')) {
    pass('G-explore', 'one-time altar');
  } else {
    fail('G-explore', JSON.stringify({ factCount, factCount2, explored, narr: afterSecond.lastActionResolution?.narrative }));
  }

  let orchH = await discoverRuins();
  await orchH.dispatch({ type: 'COMPLETE_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await orchH.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orchH.dispatch({ type: 'MOVE_NPC', npcId: 'seria', locationId: LOCATION_ID.ANCIENT_RUINS });
  orchH = createGameOrchestrator(grantRuinsKey(orchH.getState()));
  await orchH.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orchH.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await orchH.dispatch({ type: 'FREE_ACTION', turnId: orchH.getState().world.turn, input: '부서진 제단을 조사한다.' });
  const mid = orchH.getState();
  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(mid, undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  await saveOrch.dispatch({ type: 'NEW_GAME' });
  await saveOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = saveOrch.getState();
  if (
    loaded.world.currentLocationId === LOCATION_ID.ANCIENT_RUINS &&
    loaded.npcs.seria.locationId === LOCATION_ID.ANCIENT_RUINS &&
    loaded.world.locations[LOCATION_ID.ANCIENT_RUINS]?.discovered &&
    loaded.world.locations[LOCATION_ID.ANCIENT_RUINS]?.visitCount === mid.world.locations[LOCATION_ID.ANCIENT_RUINS]?.visitCount &&
    loaded.world.exploredPointIds.includes(EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE) &&
    loaded.player.locationId === LOCATION_ID.ANCIENT_RUINS
  ) {
    pass('H-save', `visit ${loaded.world.locations[LOCATION_ID.ANCIENT_RUINS]?.visitCount} explored ${loaded.world.exploredPointIds.join(',')}`);
  } else {
    fail(
      'H-save',
      JSON.stringify({
        loc: loaded.world.currentLocationId,
        seria: loaded.npcs.seria.locationId,
        visit: loaded.world.locations[LOCATION_ID.ANCIENT_RUINS],
        explored: loaded.world.exploredPointIds,
        player: loaded.player.locationId,
      })
    );
  }

  return lines;
}
