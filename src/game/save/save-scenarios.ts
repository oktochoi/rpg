import { createNpcDialogueService } from '../../ai/service';
import { applyEvents } from '../core/reducer';
import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { eventsForRecordedFact } from '../knowledge/knowledge-service';
import { doesNpcKnowFact } from '../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../npc/memory/memory-selectors';
import { withAuthoredRescue } from '../npc/memory/authored-rescue';
import { TEST_GOBLIN_COMBAT_ID } from '../story/test-scenes';
import type { WorldFact } from '../world/facts/world-fact';
import { createMemoryStorage, createSaveService, storageKeyForSlot } from '../save';

const GOBLIN_FACT: WorldFact = {
  id: 'fact_enemy_defeated_goblin_01_t1',
  type: 'ENEMY_DEFEATED',
  occurredAtTurn: 1,
  locationId: 'ancient_ruins',
  actorIds: ['player'],
  targetIds: ['goblin_01'],
  witnessIds: ['player', 'seria'],
  tags: ['combat', 'goblin', 'ruins'],
  publicLevel: 'PRIVATE',
  payload: {
    combatId: 'combat_goblin_ruins_01',
    enemyId: 'goblin_01',
  },
};

export async function runStep18SaveScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const storageA = createMemoryStorage();
  let stateA = createInitialGameState();
  stateA = applyEvents(stateA, [
    { type: 'PLAYER_CLASS_UPDATED', classId: 'mage' },
    { type: 'PLAYER_COMBAT_HP_UPDATED', currentHp: 72 },
    { type: 'RELATIONSHIP_UPDATED', npcId: 'seria', trust: 31 },
  ]);
  const orchA = createGameOrchestrator(stateA, undefined, { saveService: createSaveService(storageA) });
  await orchA.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  await orchA.dispatch({ type: 'SET_PLAYER_CLASS', classId: 'rogue' });
  await orchA.dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: 0 });
  await orchA.dispatch({ type: 'SET_PLAYER_GOLD', gold: 1 });
  await orchA.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loadedA = orchA.getState();
  if (
    loadedA.player.classId === 'mage' &&
    loadedA.player.currentHp === 72 &&
    loadedA.relationships.seria.trust === 31 &&
    loadedA.player.gold === 50
  ) {
    pass('A-save-load', `hp ${loadedA.player.currentHp} trust ${loadedA.relationships.seria.trust} class ${loadedA.player.classId}`);
  } else {
    fail('A-save-load', JSON.stringify({ hp: loadedA.player.currentHp, trust: loadedA.relationships.seria.trust, classId: loadedA.player.classId, gold: loadedA.player.gold }));
  }

  const storageB = createMemoryStorage();
  const stateB = applyEvents(createInitialGameState(), eventsForRecordedFact(GOBLIN_FACT));
  const orchB = createGameOrchestrator(stateB, undefined, { saveService: createSaveService(storageB) });
  await orchB.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  await orchB.dispatch({ type: 'GRANT_FACT', factId: GOBLIN_FACT.id, npcId: 'leon' });
  await orchB.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loadedB = orchB.getState();
  if (doesNpcKnowFact(loadedB, 'seria', GOBLIN_FACT.id) && !doesNpcKnowFact(loadedB, 'leon', GOBLIN_FACT.id)) {
    pass('B-knowledge', `seria ${doesNpcKnowFact(loadedB, 'seria', GOBLIN_FACT.id)} leon ${doesNpcKnowFact(loadedB, 'leon', GOBLIN_FACT.id)}`);
  } else {
    fail('B-knowledge', `seria ${doesNpcKnowFact(loadedB, 'seria', GOBLIN_FACT.id)} leon ${doesNpcKnowFact(loadedB, 'leon', GOBLIN_FACT.id)}`);
  }

  const storageC = createMemoryStorage();
  const orchC = createGameOrchestrator(withAuthoredRescue(createInitialGameState()), undefined, { saveService: createSaveService(storageC) });
  await orchC.dispatch({ type: 'SAVE_GAME', slotId: 'slot_2' });
  await orchC.dispatch({ type: 'NEW_GAME' });
  await orchC.dispatch({ type: 'LOAD_GAME', slotId: 'slot_2' });
  const memoryC = getMemoriesForNpc(orchC.getState(), 'seria')[0];
  const lineC = await createNpcDialogueService(() => orchC.getState()).respond('seria', '그때 기억나?');
  if (
    memoryC?.type === 'PLAYER_SAVED_ME' &&
    memoryC.importance === 9 &&
    /구한 건 아직 기억하고 있어|구한 건 잊지 않았어/.test(lineC.dialogue) &&
    lineC.usedMemoryIds.includes(memoryC.id)
  ) {
    pass('C-memory', lineC.dialogue);
  } else {
    fail('C-memory', `${JSON.stringify(memoryC)} ${lineC.dialogue}`);
  }

  const storageD = createMemoryStorage();
  const orchD = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storageD) });
  await orchD.dispatch({
    type: 'SET_RELATIONSHIP',
    npcId: 'leon',
    affection: -40,
    trust: -60,
    fear: 20,
    respect: 70,
  });
  await orchD.dispatch({ type: 'SAVE_GAME', slotId: 'slot_3' });
  await orchD.dispatch({ type: 'SET_RELATIONSHIP', npcId: 'leon', affection: 0, trust: 0, fear: 0, respect: 0 });
  await orchD.dispatch({ type: 'LOAD_GAME', slotId: 'slot_3' });
  const leon = orchD.getState().relationships.leon;
  const lineD = await createNpcDialogueService(() => orchD.getState()).respond('leon', '날 믿어도 되나?');
  if (leon.affection === -40 && leon.trust === -60 && leon.fear === 20 && leon.respect === 70 && /무력으로 밀어붙일|신뢰할 근거가 부족/.test(lineD.dialogue)) {
    pass('D-relationship', `aff ${leon.affection} trust ${leon.trust} ${lineD.dialogue}`);
  } else {
    fail('D-relationship', `${JSON.stringify(leon)} ${lineD.dialogue}`);
  }

  const storageE = createMemoryStorage();
  const orchE = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storageE) });
  await orchE.dispatch({ type: 'START_COMBAT', combatId: TEST_GOBLIN_COMBAT_ID });
  const hpBefore = orchE.getState().player.currentHp;
  await orchE.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const afterE = orchE.getState();
  if (
    afterE.mode === 'COMBAT' &&
    afterE.player.currentHp === hpBefore &&
    afterE.saveNotice === '전투 중에는 저장할 수 없습니다.' &&
    storageE.getItem(storageKeyForSlot('slot_1')) === null
  ) {
    pass('E-combat-block', afterE.saveNotice ?? '');
  } else {
    fail('E-combat-block', `${afterE.mode} ${afterE.saveNotice} hp ${afterE.player.currentHp}`);
  }

  const storageF = createMemoryStorage();
  const orchF = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storageF) });
  await orchF.dispatch({ type: 'SET_PLAYER_GOLD', gold: 50 });
  storageF.setItem(storageKeyForSlot('slot_1'), '{not-json');
  await orchF.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const afterF = orchF.getState();
  if (afterF.player.gold === 50 && afterF.saveNotice === '해당 저장 파일을 불러올 수 없습니다.') {
    pass('F-corrupt', afterF.saveNotice ?? '');
  } else {
    fail('F-corrupt', `${afterF.player.gold} ${afterF.saveNotice}`);
  }

  const storageG = createMemoryStorage();
  const orchG = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storageG) });
  await orchG.dispatch({ type: 'SET_PLAYER_GOLD', gold: 77 });
  await orchG.dispatch({ type: 'LOAD_GAME', slotId: 'slot_2' });
  const afterG = orchG.getState();
  if (afterG.player.gold === 77 && afterG.saveNotice === '저장 데이터가 없습니다.') {
    pass('G-empty', afterG.saveNotice ?? '');
  } else {
    fail('G-empty', `${afterG.player.gold} ${afterG.saveNotice}`);
  }

  return lines;
}
