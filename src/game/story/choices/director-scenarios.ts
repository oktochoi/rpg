import { generateStoryChoices, isStaleDirectorResponse, parseDirectorChoiceResponse } from '../../../ai/director';
import { createGameOrchestrator } from '../../core/orchestrator';
import { createInitialGameState } from '../../core/initial-state';
import { applyEvents } from '../../core/reducer';
import { ENCOUNTER_ID } from '../../combat/encounters/encounter-definitions';
import { PLAYER_CLASS_ID } from '../../player/classes';
import { doesPlayerKnowFact } from '../../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../../npc/memory/memory-selectors';
import { withAuthoredRescue } from '../../npc/memory/authored-rescue';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { createMemoryStorage, createSaveService } from '../../save';
import { LOCATION_ID } from '../../world/locations/location-definitions';
import { runStep24StoryScenarios } from '../story-scenarios';
import { runStep25BossScenarios } from '../../combat/boss/boss-scenarios';
import { buildChoiceCandidates, buildStoryDirectorContext, choiceRefreshKey, containsLeakedSecret, createFallbackCandidates, liveCandidates } from './index';
import { CHOICE_SOURCE } from './choice-types';
import { STORY_SCENE_ID } from '../story-scene-definitions';

function victoryResult(combatId: string) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 80, remainingMp: 40 },
    defeatedEnemyIds: combatId === ENCOUNTER_ID.RUINS_BOSS_01 ? ['ruins_guardian_001'] : ['goblin_001', 'goblin_002', 'archer_001'],
    defeatedEnemyTypes: combatId === ENCOUNTER_ID.RUINS_BOSS_01 ? ['ruins_guardian'] : ['goblin', 'goblin', 'archer'],
  };
}

async function unlockRuinsQuest() {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  return orch;
}

async function travelToRuins(orch: ReturnType<typeof createGameOrchestrator>) {
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
}

function choiceSummary(choices: { text: string; source: string; candidateId: string }[]) {
  return choices.map((choice) => `${choice.source}:${choice.candidateId}:${choice.text}`).join(' | ');
}

export async function runStep26DirectorScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const village = createGameOrchestrator(createInitialGameState());
  const villageChoices = await generateStoryChoices(village.getState());
  const villageOk =
    villageChoices.choices.length > 0 &&
    villageChoices.choices.length <= 3 &&
    parseDirectorChoiceResponse(villageChoices) !== null &&
    villageChoices.choices.every((choice) => choice.text.length > 0);
  if (villageOk) {
    pass('A-village', choiceSummary(villageChoices.choices));
  } else {
    fail('A-village', JSON.stringify(villageChoices));
  }

  const questOrch = await unlockRuinsQuest();
  await questOrch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await questOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  const questChoices = await generateStoryChoices(questOrch.getState());
  const hasRuinsMove = questChoices.choices.some(
    (choice) =>
      choice.actionType === 'MOVE' &&
      (choice.targetId === LOCATION_ID.ANCIENT_RUINS || choice.text.includes('폐허'))
  );
  if (hasRuinsMove && questChoices.choices.some((choice) => choice.source === CHOICE_SOURCE.QUEST || choice.text.includes('폐허'))) {
    pass('B-quest', choiceSummary(questChoices.choices));
  } else {
    fail('B-quest', choiceSummary(questChoices.choices));
  }

  const knowledgeOrch = await unlockRuinsQuest();
  await travelToRuins(knowledgeOrch);
  await knowledgeOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await knowledgeOrch.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult(ENCOUNTER_ID.RUINS_MIXED_01) });
  await knowledgeOrch.dispatch({ type: 'FREE_ACTION', turnId: knowledgeOrch.getState().world.turn, input: '부서진 제단을 조사한다.' });
  await knowledgeOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await knowledgeOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  const beforeShare = await generateStoryChoices(knowledgeOrch.getState());
  const shareChoice = beforeShare.choices.find((choice) => choice.intent === 'SHARE_INFORMATION' || /마법석/.test(choice.text));
  const playerKnows = doesPlayerKnowFact(knowledgeOrch.getState(), RUINS_SEAL_FACT_ID);
  await knowledgeOrch.dispatch({ type: 'SHARE_FACT', factId: RUINS_SEAL_FACT_ID, fromId: 'player', toId: 'seria' });
  const afterShare = await generateStoryChoices(knowledgeOrch.getState());
  const shareAgain = afterShare.choices.some((choice) => choice.candidateId === shareChoice?.candidateId);
  if (playerKnows && shareChoice && !shareAgain) {
    pass('C-knowledge', shareChoice.text);
  } else {
    fail('C-knowledge', JSON.stringify({ playerKnows, share: shareChoice?.text, after: choiceSummary(afterShare.choices) }));
  }

  const relHigh = createGameOrchestrator(createInitialGameState());
  await relHigh.dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: 70 });
  const highChoices = liveCandidates(relHigh.getState());
  const highTrust = highChoices.some((choice) => choice.id === 'rel_trust_seria');
  const relLow = createGameOrchestrator(createInitialGameState());
  await relLow.dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: -50 });
  const lowTrust = liveCandidates(relLow.getState()).some((choice) => choice.id === 'rel_trust_seria');
  if (highTrust && !lowTrust) {
    pass('D-relationship', `high=${highTrust} low=${lowTrust}`);
  } else {
    fail('D-relationship', `high=${highTrust} low=${lowTrust}`);
  }

  const memNone = liveCandidates(createInitialGameState()).some((choice) => choice.source === CHOICE_SOURCE.MEMORY);
  const memOrch = createGameOrchestrator(withAuthoredRescue(createInitialGameState()));
  const saved = getMemoriesForNpc(memOrch.getState(), 'seria').some((memory) => memory.type === 'PLAYER_SAVED_ME');
  const memChoice = liveCandidates(memOrch.getState()).some((choice) => choice.id === 'memory_seria_PLAYER_SAVED_ME');
  if (!memNone && saved && memChoice) {
    pass('E-memory', 'PLAYER_SAVED_ME candidate');
  } else {
    fail('E-memory', JSON.stringify({ memNone, saved, memChoice }));
  }

  async function classAtRuins(classId: 'warrior' | 'mage' | 'rogue') {
    const orch = await unlockRuinsQuest();
    await orch.dispatch({ type: 'SET_PLAYER_CLASS', classId });
    await travelToRuins(orch);
    await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
    await orch.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult(ENCOUNTER_ID.RUINS_MIXED_01) });
    const generated = await generateStoryChoices(orch.getState());
    const candidates = liveCandidates(orch.getState());
    return {
      classCandidate: candidates.some((choice) => choice.id === `class_${classId}`),
      progress: generated.choices.some(
        (choice) =>
          choice.intent === 'INVESTIGATE' ||
          choice.intent === 'USE_CLASS_ABILITY' ||
          choice.intent === 'PROGRESS_STORY' ||
          choice.source === CHOICE_SOURCE.STORY
      ),
      texts: generated.choices.map((choice) => choice.text),
    };
  }
  const warrior = await classAtRuins(PLAYER_CLASS_ID.WARRIOR);
  const mage = await classAtRuins(PLAYER_CLASS_ID.MAGE);
  const rogue = await classAtRuins(PLAYER_CLASS_ID.ROGUE);
  if (warrior.classCandidate && mage.classCandidate && rogue.classCandidate && warrior.progress && mage.progress && rogue.progress) {
    pass('F-class', `W:${warrior.texts[0]} M:${mage.texts[0]} R:${rogue.texts[0]}`);
  } else {
    fail('F-class', JSON.stringify({ warrior, mage, rogue }));
  }

  const exploreOrch = await unlockRuinsQuest();
  await travelToRuins(exploreOrch);
  await exploreOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await exploreOrch.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult(ENCOUNTER_ID.RUINS_MIXED_01) });
  const beforeExplore = liveCandidates(exploreOrch.getState()).some(
    (choice) => choice.metadata?.explorationPointId === 'royal_magic_stone' || choice.id.includes('royal_magic_stone') || /제단/.test(choice.textTemplate)
  );
  await exploreOrch.dispatch({
    type: 'FREE_ACTION',
    turnId: exploreOrch.getState().world.turn,
    input: '부서진 제단을 조사한다.',
  });
  const afterExplore = liveCandidates(exploreOrch.getState()).some(
    (choice) => choice.id === 'explore_royal_magic_stone' || (choice.metadata?.explorationPointId === 'royal_magic_stone' && choice.source === CHOICE_SOURCE.EXPLORATION)
  );
  if (beforeExplore && !afterExplore) {
    pass('G-exploration', 'altar candidate removed after oneTime');
  } else {
    fail('G-exploration', JSON.stringify({ beforeExplore, afterExplore }));
  }

  const bossOrch = await unlockRuinsQuest();
  await travelToRuins(bossOrch);
  await bossOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await bossOrch.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult(ENCOUNTER_ID.RUINS_MIXED_01) });
  await bossOrch.dispatch({
    type: 'FREE_ACTION',
    turnId: bossOrch.getState().world.turn,
    input: '부서진 제단을 조사한다.',
  });
  const bossScene = bossOrch.getState().story.currentSceneId;
  const bossChoices = await generateStoryChoices(bossOrch.getState());
  const fight = bossChoices.choices.some((choice) => /수호자/.test(choice.text) || choice.intent === 'FIGHT');
  const retreat = bossChoices.choices.some((choice) => /물러/.test(choice.text) || choice.intent === 'AVOID' || choice.intent === 'MOVE');
  if (
    (bossScene === STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS || bossScene === STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY) &&
    fight &&
    retreat
  ) {
    pass('H-boss', `${bossScene} ${choiceSummary(bossChoices.choices)}`);
  } else {
    fail('H-boss', `${bossScene} ${choiceSummary(bossChoices.choices)}`);
  }

  const invalidOrch = createGameOrchestrator(createInitialGameState());
  const talkCandidate = liveCandidates(invalidOrch.getState()).find((choice) => choice.id === 'npc_talk_seria' || choice.id === 'story_talk_seria_here');
  const locBefore = invalidOrch.getState().world.currentLocationId;
  await invalidOrch.dispatch({ type: 'MOVE_NPC', npcId: 'seria', locationId: LOCATION_ID.BLUE_MOON_INN });
  await invalidOrch.dispatch({
    type: 'SELECT_DYNAMIC_CHOICE',
    choiceId: `choice_${invalidOrch.getState().world.turn}_${talkCandidate?.id ?? 'npc_talk_seria'}`,
    turnId: invalidOrch.getState().world.turn,
    candidateId: talkCandidate?.id ?? 'npc_talk_seria',
  });
  const afterInvalid = invalidOrch.getState();
  if (
    talkCandidate &&
    afterInvalid.world.currentLocationId === locBefore &&
    afterInvalid.npcs.seria.locationId === LOCATION_ID.BLUE_MOON_INN &&
    afterInvalid.mode !== 'COMBAT' &&
    (afterInvalid.story.lastActionNarrative ?? '').length > 0
  ) {
    pass('I-invalidated', afterInvalid.story.lastActionNarrative ?? '');
  } else {
    fail('I-invalidated', JSON.stringify({ talk: talkCandidate?.id, loc: afterInvalid.world.currentLocationId, seria: afterInvalid.npcs.seria.locationId, narr: afterInvalid.story.lastActionNarrative }));
  }

  const turn21 = {
    ...createInitialGameState(),
    world: {
      ...createInitialGameState().world,
      turn: 21,
    },
  };
  const fake = { turnId: 20, choices: villageChoices.choices };
  if (isStaleDirectorResponse(21, fake) && !isStaleDirectorResponse(20, fake)) {
    const stale = await generateStoryChoices(turn21, {
      async generateChoices() {
        return fake;
      },
    });
    if (stale.debugReason === 'stale_turn' && stale.choices.length > 0) {
      pass('J-turnId', 'stale discarded, current fallback kept');
    } else {
      fail('J-turnId', JSON.stringify(stale));
    }
  } else {
    fail('J-turnId', 'isStaleDirectorResponse mismatch');
  }

  const storage = createMemoryStorage();
  const saveService = createSaveService(storage);
  const saveOrch = createGameOrchestrator((await unlockRuinsQuest()).getState(), undefined, { saveService });
  await saveOrch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await saveOrch.dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: 70 });
  await saveOrch.dispatch({ type: 'FREE_ACTION', turnId: saveOrch.getState().world.turn, input: '세리아를 구한다.' });
  const beforeSaveChoices = await generateStoryChoices(saveOrch.getState());
  const refreshBefore = choiceRefreshKey(saveOrch.getState());
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const loadOrch = createGameOrchestrator(createInitialGameState(), undefined, { saveService });
  await loadOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const afterLoadChoices = await generateStoryChoices(loadOrch.getState());
  const same =
    choiceRefreshKey(loadOrch.getState()) === refreshBefore &&
    afterLoadChoices.choices.map((choice) => choice.candidateId).join('|') ===
      beforeSaveChoices.choices.map((choice) => choice.candidateId).join('|');
  if (same) {
    pass('K-save-load', choiceSummary(afterLoadChoices.choices));
  } else {
    fail('K-save-load', `${choiceSummary(beforeSaveChoices.choices)} vs ${choiceSummary(afterLoadChoices.choices)}`);
  }

  const empty = await generateStoryChoices(createInitialGameState(), undefined, { forceEmpty: true });
  const fallback = createFallbackCandidates();
  if (empty.choices.length >= 1 && fallback.length >= 1 && empty.choices[0].actionType === 'WAIT') {
    pass('L-fallback', empty.choices[0].text);
  } else {
    fail('L-fallback', JSON.stringify(empty));
  }

  const leakState = applyEvents(createInitialGameState(), [
    {
      type: 'WORLD_FACT_RECORDED',
      fact: {
        id: 'secret_assassination_stone',
        type: 'IMPORTANT_EVENT',
        occurredAtTurn: 1,
        locationId: LOCATION_ID.ANCIENT_RUINS,
        actorIds: ['king'],
        witnessIds: [],
        tags: ['암살', 'royal'],
        publicLevel: 'PRIVATE',
        payload: { summary: '왕실 마법석이 왕 암살 사건과 관련됨' },
      },
    },
  ]);
  const leakContext = buildStoryDirectorContext(leakState);
  const leakChoices = await generateStoryChoices(leakState);
  const leakTexts = [
    ...leakChoices.choices.map((choice) => choice.text),
    ...buildChoiceCandidates(leakState, leakContext).map((choice) => choice.textTemplate),
  ].join(' ');
  const npcPretend = leakChoices.choices.some((choice) => /이미 알고 있는 암살/.test(choice.text));
  if (!containsLeakedSecret(leakTexts) && !npcPretend && !leakContext.relevantPlayerKnownFacts.some((fact) => fact.id === 'secret_assassination_stone')) {
    pass('M-leak', 'secret omitted from player-facing choices');
  } else {
    fail('M-leak', leakTexts);
  }

  const diverse = villageChoices.choices;
  const sources = new Set(diverse.map((choice) => choice.source));
  if (diverse.length <= 1 || sources.size >= Math.min(2, diverse.length)) {
    pass('N-diversity', [...sources].join(','));
  } else {
    fail('N-diversity', choiceSummary(diverse));
  }

  const first = await generateStoryChoices(createInitialGameState());
  const second = await generateStoryChoices(createInitialGameState());
  const deterministic =
    first.choices.map((choice) => `${choice.candidateId}:${choice.text}`).join('|') ===
    second.choices.map((choice) => `${choice.candidateId}:${choice.text}`).join('|');
  if (deterministic) {
    pass('O-deterministic', first.choices.map((choice) => choice.candidateId).join(','));
  } else {
    fail('O-deterministic', `${choiceSummary(first.choices)} vs ${choiceSummary(second.choices)}`);
  }

  const regression24 = await runStep24StoryScenarios();
  const regression25 = await runStep25BossScenarios();
  const failedRegression = [...regression24, ...regression25].filter((line) => line.startsWith('FAIL'));
  if (failedRegression.length === 0) {
    pass('P-regression', `story ${regression24.filter((line) => line.startsWith('PASS')).length} boss ${regression25.filter((line) => line.startsWith('PASS')).length}`);
  } else {
    fail('P-regression', failedRegression.join(' / '));
  }

  void QUEST_STATUS;
  return lines;
}
