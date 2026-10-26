import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { PLAYER_CLASS_ID } from '../player/classes';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../npc/memory/memory-selectors';
import { withAuthoredRescue } from '../npc/memory/authored-rescue';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { createMemoryStorage, createSaveService } from '../save';
import { LOCATION_ID } from '../world/locations/location-definitions';
import { getAvailableChoices } from './story-choice-service';
import {
  CHOICE_ENTER_CLASS_MAGE,
  CHOICE_ENTER_CLASS_ROGUE,
  CHOICE_ENTER_CLASS_WARRIOR,
  CHOICE_INVESTIGATE_MAGE,
  CHOICE_INVESTIGATE_ROGUE,
  CHOICE_INVESTIGATE_WARRIOR,
  CHOICE_RECALL_SAVED,
  STORY_SCENE_ID,
} from './story-scene-definitions';
import { CHOICE_TALK_SERIA } from '../world/locations/location-story-choices';
import { CHOICE_REPORT_RUINS } from '../quests/quest-story-choices';
import { runStoryDeadlockScenarios } from './story-deadlock-scenarios';
import { runStoryFlowScenarios } from './story-flow-scenarios';

function victoryResult(combatId: string) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 80, remainingMp: 40 },
    defeatedEnemyIds: ['goblin_001', 'goblin_002', 'archer_001'],
    defeatedEnemyTypes: ['goblin', 'goblin', 'archer'],
  };
}

function defeatResult(combatId: string) {
  return {
    combatId,
    outcome: 'DEFEAT' as const,
    player: { remainingHp: 0, remainingMp: 10 },
    defeatedEnemyIds: [] as string[],
    defeatedEnemyTypes: [] as string[],
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

async function winRuinsCombat(orch: ReturnType<typeof createGameOrchestrator>) {
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orch.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult(ENCOUNTER_ID.RUINS_MIXED_01) });
}

export async function runStep24StoryScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orchA = createGameOrchestrator(createInitialGameState());
  const intro = orchA.getState().story.currentSceneId;
  await orchA.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_TALK_SERIA });
  const first = orchA.getState().story.currentSceneId;
  await orchA.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '날씨는 어떤가?',
    npcText: '평범한 하루야.',
  });
  const second = orchA.getState().story.currentSceneId;
  if (
    intro === STORY_SCENE_ID.LUEN_VILLAGE_INTRO &&
    first === STORY_SCENE_ID.SERIA_FIRST_MEETING &&
    second !== STORY_SCENE_ID.SERIA_FIRST_MEETING &&
    orchA.getState().story.visitedSceneIds.includes(STORY_SCENE_ID.SERIA_FIRST_MEETING)
  ) {
    pass('A-first-visit', `${intro} → ${first} → ${second}`);
  } else {
    fail('A-first-visit', JSON.stringify({ intro, first, second, visited: orchA.getState().story.visitedSceneIds }));
  }

  const locked = createGameOrchestrator(createInitialGameState()).getState().story.currentSceneId;
  const orchAvailable = await unlockRuinsQuest();
  const available = orchAvailable.getState().story.currentSceneId;
  await orchAvailable.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  const active = orchAvailable.getState().story.currentSceneId;
  await orchAvailable.dispatch({ type: 'COMPLETE_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  const completed = orchAvailable.getState().story.currentSceneId;
  if (
    locked === STORY_SCENE_ID.LUEN_VILLAGE_INTRO &&
    available === STORY_SCENE_ID.SERIA_RUINS_OFFER &&
    active === STORY_SCENE_ID.SERIA_RUINS_ACTIVE &&
    completed === STORY_SCENE_ID.SERIA_RUINS_COMPLETED
  ) {
    pass('B-quest-state', `${locked}/${available}/${active}/${completed}`);
  } else {
    fail('B-quest-state', JSON.stringify({ locked, available, active, completed }));
  }

  const classCases = [
    { classId: PLAYER_CLASS_ID.MAGE, enter: CHOICE_ENTER_CLASS_MAGE, investigate: CHOICE_INVESTIGATE_MAGE, scene: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_MAGE },
    { classId: PLAYER_CLASS_ID.WARRIOR, enter: CHOICE_ENTER_CLASS_WARRIOR, investigate: CHOICE_INVESTIGATE_WARRIOR, scene: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_WARRIOR },
    { classId: PLAYER_CLASS_ID.ROGUE, enter: CHOICE_ENTER_CLASS_ROGUE, investigate: CHOICE_INVESTIGATE_ROGUE, scene: STORY_SCENE_ID.ANCIENT_RUINS_INVESTIGATION_ROGUE },
  ] as const;
  const classResults: string[] = [];
  let classOk = true;
  for (const item of classCases) {
    const orch = await unlockRuinsQuest();
    await orch.dispatch({ type: 'SET_PLAYER_CLASS', classId: item.classId });
    await travelToRuins(orch);
    await winRuinsCombat(orch);
    const afterVictory = orch.getState().story.currentSceneId;
    const choiceIds = getAvailableChoices(orch.getState()).map((choice) => choice.id);
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: item.enter });
    const classScene = orch.getState().story.currentSceneId;
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: item.investigate });
    const afterInvestigate = orch.getState();
    const progressed =
      afterVictory === STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY &&
      choiceIds.includes(item.enter) &&
      !choiceIds.some((id) => id !== item.enter && [CHOICE_ENTER_CLASS_MAGE, CHOICE_ENTER_CLASS_WARRIOR, CHOICE_ENTER_CLASS_ROGUE].includes(id)) &&
      classScene === item.scene &&
      doesPlayerKnowFact(afterInvestigate, RUINS_SEAL_FACT_ID) &&
      afterInvestigate.story.currentSceneId === STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY;
    classResults.push(`${item.classId}:${classScene}`);
    if (!progressed) {
      classOk = false;
      fail(
        'C-class-branch',
        JSON.stringify({
          classId: item.classId,
          afterVictory,
          choiceIds,
          classScene,
          scene: afterInvestigate.story.currentSceneId,
          knows: doesPlayerKnowFact(afterInvestigate, RUINS_SEAL_FACT_ID),
        })
      );
      break;
    }
  }
  if (classOk) {
    pass('C-class-branch', classResults.join(' | '));
  }

  const orchHigh = createGameOrchestrator(createInitialGameState());
  await orchHigh.dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: 60 });
  const high = orchHigh.getState().story.currentSceneId;
  const orchLow = createGameOrchestrator(createInitialGameState());
  await orchLow.dispatch({ type: 'SET_RELATIONSHIP', npcId: 'seria', trust: -40 });
  const low = orchLow.getState().story.currentSceneId;
  const orchNeutral = createGameOrchestrator(createInitialGameState());
  const neutral = orchNeutral.getState().story.currentSceneId;
  if (
    high === STORY_SCENE_ID.SERIA_HIGH_TRUST &&
    low === STORY_SCENE_ID.SERIA_LOW_TRUST &&
    neutral === STORY_SCENE_ID.LUEN_VILLAGE_INTRO
  ) {
    pass('D-relationship', `${high} / ${low} / ${neutral}`);
  } else {
    fail('D-relationship', JSON.stringify({ high, low, neutral }));
  }

  const orchE = await unlockRuinsQuest();
  await travelToRuins(orchE);
  await orchE.dispatch({ type: 'FREE_ACTION', turnId: orchE.getState().world.turn, input: '부서진 제단을 조사한다.' });
  await orchE.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orchE.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  const unknown = orchE.getState();
  const unknownScene = unknown.story.currentSceneId;
  const unknownOk =
    doesPlayerKnowFact(unknown, RUINS_SEAL_FACT_ID) &&
    !doesNpcKnowFact(unknown, 'seria', RUINS_SEAL_FACT_ID) &&
    unknownScene === STORY_SCENE_ID.SERIA_REPORT_UNKNOWN &&
    !/왕실 문장/.test(unknown.story.narration);
  await orchE.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REPORT_RUINS });
  const known = orchE.getState();
  if (unknownOk && known.story.currentSceneId === STORY_SCENE_ID.SERIA_REPORT_KNOWN && doesNpcKnowFact(known, 'seria', RUINS_SEAL_FACT_ID)) {
    pass('E-npc-knowledge', `${unknownScene} → ${known.story.currentSceneId}`);
  } else {
    fail(
      'E-npc-knowledge',
      JSON.stringify({
        unknownScene,
        unknownOk,
        known: known.story.currentSceneId,
        seriaKnows: doesNpcKnowFact(known, 'seria', RUINS_SEAL_FACT_ID),
        narr: unknown.story.narration,
      })
    );
  }

  const orchF = createGameOrchestrator(withAuthoredRescue(createInitialGameState()));
  const beforeMemoryChoices = getAvailableChoices(createInitialGameState()).map((choice) => choice.id);
  const beforeMemoryScene = createInitialGameState().story.currentSceneId;
  await orchF.dispatch({ type: 'FREE_ACTION', turnId: orchF.getState().world.turn, input: '주변을 살펴본다.' });
  const afterMemory = orchF.getState();
  const saved = getMemoriesForNpc(afterMemory, 'seria').some((memory) => memory.type === 'PLAYER_SAVED_ME');
  const memoryChoice = getAvailableChoices(afterMemory).some((choice) => choice.id === CHOICE_RECALL_SAVED);
  if (
    saved &&
    afterMemory.story.currentSceneId === STORY_SCENE_ID.SERIA_SAVED_MEMORY &&
    !beforeMemoryChoices.includes(CHOICE_RECALL_SAVED) &&
    beforeMemoryScene !== STORY_SCENE_ID.SERIA_SAVED_MEMORY &&
    memoryChoice
  ) {
    pass('F-memory', afterMemory.story.currentSceneId);
  } else {
    fail(
      'F-memory',
      JSON.stringify({
        saved,
        scene: afterMemory.story.currentSceneId,
        beforeMemoryScene,
        memoryChoice,
        beforeMemoryChoices,
        narr: afterMemory.story.narration,
      })
    );
  }

  const orchG = await unlockRuinsQuest();
  await travelToRuins(orchG);
  await winRuinsCombat(orchG);
  const victoryScene = orchG.getState().story.currentSceneId;
  const orchDefeat = await unlockRuinsQuest();
  await travelToRuins(orchDefeat);
  await orchDefeat.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orchDefeat.dispatch({ type: 'RESOLVE_COMBAT', result: defeatResult(ENCOUNTER_ID.RUINS_MIXED_01) });
  const defeatScene = orchDefeat.getState().story.currentSceneId;
  if (victoryScene === STORY_SCENE_ID.ANCIENT_RUINS_AFTER_VICTORY && defeatScene === STORY_SCENE_ID.ANCIENT_RUINS_AFTER_DEFEAT) {
    pass('G-combat', `${victoryScene} / ${defeatScene}`);
  } else {
    fail('G-combat', JSON.stringify({ victoryScene, defeatScene }));
  }

  const orchH = createGameOrchestrator(createInitialGameState());
  await orchH.dispatch({ type: 'FREE_ACTION', turnId: 1, input: '여관으로 간다.' });
  const innScene = orchH.getState().story.currentSceneId;
  const orchH2 = await unlockRuinsQuest();
  await travelToRuins(orchH2);
  await winRuinsCombat(orchH2);
  await orchH2.dispatch({ type: 'FREE_ACTION', turnId: orchH2.getState().world.turn, input: '부서진 제단을 조사한다.' });
  const freeDiscover = orchH2.getState().story.currentSceneId;
  if (
    (innScene === STORY_SCENE_ID.BLUE_MOON_INN || innScene === STORY_SCENE_ID.MARTA_FIRST_MEETING) &&
    freeDiscover === STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY
  ) {
    pass('H-free-action', `${innScene} / ${freeDiscover}`);
  } else {
    fail('H-free-action', JSON.stringify({ innScene, freeDiscover, loc: orchH2.getState().world.currentLocationId }));
  }

  const storageI = createMemoryStorage();
  const orchI = await unlockRuinsQuest();
  const saveServiceI = createSaveService(storageI);
  const orchISaved = createGameOrchestrator(orchI.getState(), undefined, { saveService: saveServiceI });
  await travelToRuins(orchISaved);
  await winRuinsCombat(orchISaved);
  await orchISaved.dispatch({ type: 'FREE_ACTION', turnId: orchISaved.getState().world.turn, input: '주변을 살펴본다.' });
  const beforeSave = orchISaved.getState();
  await orchISaved.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const orchILoad = createGameOrchestrator(createInitialGameState(), undefined, { saveService: saveServiceI });
  await orchILoad.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = orchILoad.getState();
  const loadOk =
    loaded.world.currentLocationId === beforeSave.world.currentLocationId &&
    loaded.story.currentSceneId === beforeSave.story.currentSceneId &&
    loaded.story.visitedSceneIds.join('|') === beforeSave.story.visitedSceneIds.join('|') &&
    loaded.quests[QUEST_ID.RUINS_MYSTERY]?.status === beforeSave.quests[QUEST_ID.RUINS_MYSTERY]?.status &&
    doesPlayerKnowFact(loaded, RUINS_SEAL_FACT_ID) === doesPlayerKnowFact(beforeSave, RUINS_SEAL_FACT_ID) &&
    (loaded.relationships.seria?.trust ?? 0) === (beforeSave.relationships.seria?.trust ?? 0) &&
    getMemoriesForNpc(loaded, 'seria').some((memory) => memory.type === 'PLAYER_SAVED_ME') ===
      getMemoriesForNpc(beforeSave, 'seria').some((memory) => memory.type === 'PLAYER_SAVED_ME');
  if (loadOk) {
    pass('I-save-load', `${loaded.world.currentLocationId} / ${loaded.story.currentSceneId}`);
  } else {
    fail(
      'I-save-load',
      JSON.stringify({
        loc: [beforeSave.world.currentLocationId, loaded.world.currentLocationId],
        scene: [beforeSave.story.currentSceneId, loaded.story.currentSceneId],
        visited: [beforeSave.story.visitedSceneIds, loaded.story.visitedSceneIds],
      })
    );
  }

  const storageJ = createMemoryStorage();
  const saveJ = createSaveService(storageJ);
  const invalid = createInitialGameState();
  const broken = {
    ...invalid,
    story: {
      ...invalid.story,
      currentSceneId: 'scene_does_not_exist',
    },
  };
  saveJ.save('slot_1', broken, 0);
  const orchJ = createGameOrchestrator(createInitialGameState(), undefined, { saveService: saveJ });
  await orchJ.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const recovered = orchJ.getState();
  const mismatch = applyEvents(createInitialGameState(), [
    {
      type: 'GAME_LOADED',
      slotId: 'slot_1',
      gameState: {
        ...createInitialGameState(),
        world: {
          ...createInitialGameState().world,
          currentLocationId: LOCATION_ID.ANCIENT_RUINS,
        },
        player: {
          ...createInitialGameState().player,
          locationId: LOCATION_ID.ANCIENT_RUINS,
        },
        story: {
          ...createInitialGameState().story,
          currentSceneId: STORY_SCENE_ID.LUEN_VILLAGE_INTRO,
        },
      },
    },
  ]);
  if (
    recovered.story.currentSceneId === STORY_SCENE_ID.LUEN_VILLAGE_INTRO &&
    recovered.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE &&
    mismatch.story.currentSceneId !== STORY_SCENE_ID.LUEN_VILLAGE_INTRO &&
    mismatch.world.currentLocationId === LOCATION_ID.ANCIENT_RUINS
  ) {
    pass('J-invalid-scene', `${recovered.story.currentSceneId} / mismatch ${mismatch.story.currentSceneId}`);
  } else {
    fail(
      'J-invalid-scene',
      JSON.stringify({
        recovered: recovered.story.currentSceneId,
        loc: recovered.world.currentLocationId,
        mismatch: mismatch.story.currentSceneId,
        mismatchLoc: mismatch.world.currentLocationId,
      })
    );
  }

  lines.push(...(await runStoryDeadlockScenarios()));
  lines.push(...(await runStoryFlowScenarios()));

  return lines;
}
