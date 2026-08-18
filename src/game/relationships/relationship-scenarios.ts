import { createNpcDialogueService } from '../../ai/service';
import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { TEST_GOBLIN_COMBAT_ID } from '../story/test-scenes';
import { eventsForRelationshipRequests } from './relationship-service';

export async function runStep16RelationshipScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orchA = createGameOrchestrator(createInitialGameState());
  await orchA.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 돕는다.' });
  const seriaA = orchA.getState().relationships.seria;
  if (seriaA.affection === 8 && seriaA.trust === 6 && seriaA.respect === 3 && seriaA.fear === 0) {
    pass('A-help', `aff ${seriaA.affection} trust ${seriaA.trust} respect ${seriaA.respect}`);
  } else {
    fail('A-help', JSON.stringify(seriaA));
  }

  const orchB = createGameOrchestrator(createInitialGameState());
  await orchB.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 위협한다.' });
  const seriaB = orchB.getState().relationships.seria;
  if (seriaB.affection === -12 && seriaB.trust === -10 && seriaB.fear === 20) {
    pass('B-threaten', `aff ${seriaB.affection} trust ${seriaB.trust} fear ${seriaB.fear}`);
  } else {
    fail('B-threaten', JSON.stringify(seriaB));
  }

  const withLeon = createInitialGameState();
  const orchC = createGameOrchestrator({
    ...withLeon,
    npcs: {
      ...withLeon.npcs,
      leon: { ...withLeon.npcs.leon, locationId: withLeon.world.currentLocationId },
    },
  });
  await orchC.dispatch({ type: 'START_COMBAT', combatId: TEST_GOBLIN_COMBAT_ID });
  await orchC.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: TEST_GOBLIN_COMBAT_ID,
      outcome: 'VICTORY',
      player: { remainingHp: 80 },
      defeatedEnemyIds: ['goblin_01'],
    },
  });
  const leonC = orchC.getState().relationships.leon;
  const seriaC = orchC.getState().relationships.seria;
  if (leonC.respect === 8 && leonC.affection === 0 && seriaC.respect === 10) {
    pass('C-skill', `leon respect ${leonC.respect} aff ${leonC.affection} seria respect ${seriaC.respect}`);
  } else {
    fail('C-skill', `leon ${JSON.stringify(leonC)} seria respect ${seriaC.respect}`);
  }

  const request = {
    npcId: 'seria',
    reason: 'PLAYER_HELPED_NPC' as const,
    sourceEventId: 'dup-help-seria',
  };
  let stateD = createInitialGameState();
  const first = eventsForRelationshipRequests(stateD, [request]);
  stateD = applyEvents(stateD, first);
  const second = eventsForRelationshipRequests(stateD, [request]);
  const afterDup = applyEvents(stateD, first);
  if (first.length === 1 && second.length === 0 && afterDup.relationships.seria.affection === 8) {
    pass('D-idempotent', `first ${first.length} second ${second.length} aff ${afterDup.relationships.seria.affection}`);
  } else {
    fail('D-idempotent', `first ${first.length} second ${second.length} aff ${afterDup.relationships.seria.affection}`);
  }

  const orchE = createGameOrchestrator(createInitialGameState());
  await orchE.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 돕는다.' });
  const dialogue = createNpcDialogueService(() => orchE.getState());
  const helped = await dialogue.respond('seria', '당신은 누구야?');
  await orchE.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 위협한다.' });
  const afraid = await dialogue.respond('seria', '당신은 누구야?');
  if (/쓸모없는 사람은 아니라는/.test(helped.dialogue) && /그렇게까지 할 필요는 없잖아/.test(afraid.dialogue)) {
    pass('E-dialogue', `helped=${helped.dialogue} | afraid=${afraid.dialogue}`);
  } else {
    fail('E-dialogue', `helped=${helped.dialogue} | afraid=${afraid.dialogue}`);
  }

  return lines;
}
