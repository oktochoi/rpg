import { createMockActionParser } from '../action-parser/mockActionParser';
import { createGameOrchestrator } from '../../game/core/orchestrator';
import { createInitialGameState } from '../../game/core/initial-state';
import { buildActionParserContext } from '../../game/actions/build-parser-context';
import { validateAction } from '../../game/actions/action-validator';

export async function runStep15ActionScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);
  const parser = createMockActionParser();

  const orchA = createGameOrchestrator(createInitialGameState());
  await orchA.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아에게 폐허에 대해 묻는다.' });
  const stateA = orchA.getState();
  const asked =
    stateA.lastActionResolution?.actionType === 'ASK' &&
    stateA.lastActionResolution.success &&
    stateA.story.dialogue.some((message) => message.speaker === 'NPC') &&
    stateA.mode === 'STORY';
  if (asked) {
    pass('A-ask', stateA.story.dialogue.filter((message) => message.speaker === 'NPC').at(-1)?.text ?? '');
  } else {
    fail('A-ask', `${stateA.lastActionResolution?.actionType} ${stateA.mode} ${stateA.story.dialogue.length}`);
  }

  const orchB = createGameOrchestrator(createInitialGameState());
  await orchB.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '세리아를 공격한다.' });
  const stateB = orchB.getState();
  if (stateB.mode === 'COMBAT' && stateB.activeCombatId === 'combat_duel_seria') {
    pass('B-attack', `combat ${stateB.activeCombatId}`);
  } else {
    fail('B-attack', `${stateB.mode} ${stateB.activeCombatId} ${stateB.lastActionResolution?.actionType}`);
  }

  const orchC1 = createGameOrchestrator(createInitialGameState());
  await orchC1.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '경비병에게 50골드를 준다.' });
  const stateC1 = orchC1.getState();
  if (stateC1.lastActionResolution?.actionType === 'GIVE' && stateC1.lastActionResolution.success && stateC1.player.gold === 0) {
    pass('C-gold-ok', `gold ${stateC1.player.gold}`);
  } else {
    fail('C-gold-ok', `${stateC1.lastActionResolution?.actionType} gold=${stateC1.player.gold} success=${stateC1.lastActionResolution?.success}`);
  }

  const orchC2 = createGameOrchestrator(createInitialGameState());
  await orchC2.dispatch({ type: 'SET_PLAYER_GOLD', gold: 0 });
  await orchC2.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '경비병에게 50골드를 준다.' });
  const stateC2 = orchC2.getState();
  if (!stateC2.lastActionResolution?.success && stateC2.player.gold === 0 && /부족/.test(stateC2.story.lastActionNarrative ?? '')) {
    pass('C-gold-fail', stateC2.story.lastActionNarrative ?? '');
  } else {
    fail('C-gold-fail', `${stateC2.lastActionResolution?.success} gold=${stateC2.player.gold} ${stateC2.story.lastActionNarrative}`);
  }

  const orchD = createGameOrchestrator(createInitialGameState());
  await orchD.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '달을 폭파한다.' });
  const stateD = orchD.getState();
  const parsedD = await parser.parse('달을 폭파한다.', buildActionParserContext(createInitialGameState()));
  const validationD = validateAction(parsedD, createInitialGameState());
  if (
    parsedD.actionType === 'UNKNOWN' &&
    !stateD.lastActionResolution?.success &&
    (validationD.resultType === 'UNKNOWN_ACTION' || validationD.resultType === 'INVALID')
  ) {
    pass('D-impossible', stateD.story.lastActionNarrative ?? parsedD.actionType);
  } else {
    fail('D-impossible', `${parsedD.actionType} ${validationD.resultType} ${stateD.story.lastActionNarrative}`);
  }

  const orchE = createGameOrchestrator(createInitialGameState());
  await orchE.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '여기 없는 레온을 공격한다.' });
  const stateE = orchE.getState();
  if (
    stateE.mode !== 'COMBAT' &&
    !stateE.lastActionResolution?.success &&
    /대상이 없습니다/.test(stateE.story.lastActionNarrative ?? '')
  ) {
    pass('E-missing-target', stateE.story.lastActionNarrative ?? '');
  } else {
    fail('E-missing-target', `${stateE.mode} ${stateE.lastActionResolution?.actionType} ${stateE.story.lastActionNarrative}`);
  }

  return lines;
}
