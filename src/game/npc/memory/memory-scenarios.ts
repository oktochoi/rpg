import { createNpcDialogueService } from '../../../ai/service';
import { createGameOrchestrator } from '../../core/orchestrator';
import { createInitialGameState } from '../../core/initial-state';
import { applyEvents } from '../../core/reducer';
import { eventsForMemoryRequests } from './memory-service';
import { getMemoriesForNpc } from './memory-selectors';

export async function runStep17MemoryScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orchA = createGameOrchestrator(createInitialGameState());
  await orchA.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 돕는다.' });
  const helped = getMemoriesForNpc(orchA.getState(), 'seria')[0];
  if (
    helped?.type === 'PLAYER_HELPED_ME' &&
    helped.emotionalTag === 'GRATITUDE' &&
    helped.importance === 5 &&
    getMemoriesForNpc(orchA.getState(), 'seria').length === 1
  ) {
    pass('A-help', `${helped.type} ${helped.emotionalTag} ${helped.importance}`);
  } else {
    fail('A-help', JSON.stringify(getMemoriesForNpc(orchA.getState(), 'seria')));
  }

  const orchB = createGameOrchestrator(createInitialGameState());
  await orchB.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 구한다.' });
  const saved = getMemoriesForNpc(orchB.getState(), 'seria')[0];
  const dialogueB = createNpcDialogueService(() => orchB.getState());
  const savedLine = await dialogueB.respond('seria', '나 못 믿겠어?');
  if (
    saved?.type === 'PLAYER_SAVED_ME' &&
    saved.importance === 9 &&
    /구한 건 잊지 않았어/.test(savedLine.dialogue) &&
    savedLine.usedMemoryIds.includes(saved.id)
  ) {
    pass('B-save', `${saved.importance} ${savedLine.dialogue}`);
  } else {
    fail('B-save', `${JSON.stringify(saved)} ${savedLine.dialogue}`);
  }

  const withLeon = createInitialGameState();
  const orchC = createGameOrchestrator({
    ...withLeon,
    npcs: {
      ...withLeon.npcs,
      leon: { ...withLeon.npcs.leon, locationId: withLeon.world.currentLocationId },
    },
  });
  await orchC.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '레온을 위협한다.' });
  const threatened = getMemoriesForNpc(orchC.getState(), 'leon')[0];
  const dialogueC = createNpcDialogueService(() => orchC.getState());
  const threatLine = await dialogueC.respond('leon', '지난번 일 기억해?');
  if (
    threatened?.type === 'PLAYER_THREATENED_ME' &&
    threatened.emotionalTag === 'FEAR' &&
    /협박할 생각이라면/.test(threatLine.dialogue) &&
    threatLine.usedMemoryIds.includes(threatened.id)
  ) {
    pass('C-threaten', `${threatened.type} ${threatLine.dialogue}`);
  } else {
    fail('C-threaten', `${JSON.stringify(threatened)} ${threatLine.dialogue}`);
  }

  const request = {
    npcId: 'seria',
    reason: 'PLAYER_HELPED_NPC' as const,
    sourceEventId: 'dup-help-seria',
  };
  let stateD = createInitialGameState();
  const first = eventsForMemoryRequests(stateD, [request]);
  stateD = applyEvents(stateD, first);
  const second = eventsForMemoryRequests(stateD, [request]);
  const afterDup = applyEvents(stateD, first);
  if (first.length === 1 && second.length === 0 && getMemoriesForNpc(afterDup, 'seria').length === 1) {
    pass('D-idempotent', `first ${first.length} second ${second.length} count ${getMemoriesForNpc(afterDup, 'seria').length}`);
  } else {
    fail(
      'D-idempotent',
      `first ${first.length} second ${second.length} count ${getMemoriesForNpc(afterDup, 'seria').length}`
    );
  }

  const orchE = createGameOrchestrator(createInitialGameState());
  await orchE.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 돕는다.' });
  const leonMemories = getMemoriesForNpc(orchE.getState(), 'leon');
  if (getMemoriesForNpc(orchE.getState(), 'seria').length === 1 && leonMemories.length === 0) {
    pass('E-other-npc', `seria ${getMemoriesForNpc(orchE.getState(), 'seria').length} leon ${leonMemories.length}`);
  } else {
    fail('E-other-npc', `leon ${JSON.stringify(leonMemories)}`);
  }

  const orchF = createGameOrchestrator(createInitialGameState());
  const emptyService = createNpcDialogueService(() => orchF.getState());
  const emptyLine = await emptyService.respond('seria', '내가 전에 도와준 거 기억해?');
  await orchF.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 돕는다.' });
  const remembered = await createNpcDialogueService(() => orchF.getState()).respond('seria', '내가 전에 도와준 거 기억해?');
  if (
    /기억은 없어/.test(emptyLine.dialogue) &&
    emptyLine.usedMemoryIds.length === 0 &&
    /기억하고 있어/.test(remembered.dialogue) &&
    remembered.usedMemoryIds.length === 1
  ) {
    pass('F-dialogue', `empty=${emptyLine.dialogue} | remembered=${remembered.dialogue}`);
  } else {
    fail('F-dialogue', `empty=${emptyLine.dialogue} | remembered=${remembered.dialogue}`);
  }

  return lines;
}
