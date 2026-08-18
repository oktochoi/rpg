import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { PLAYER_CLASS_ID, canChooseFirstAdvancement, displayClassName, getPlayerClass } from '../player/classes';
import { getSkillForSlot } from '../combat/skills/skill-definitions';
import { buildCombatConfig } from '../combat/build-combat-config';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { ACTION_EXP, eventsForExpGrant } from '../player/progression';
import { ACTION_TIME_COST, COMBAT_TIME_COST, travelMinutesBetween } from '../time/action-time-config';
import { dayFromTotalMinutes, formatClock, hourFromTotalMinutes, minuteFromTotalMinutes } from '../time/clock-types';
import { LOCATION_ID } from '../world/locations/location-definitions';
import {
  CHOICE_INVESTIGATE_ALTAR,
  CHOICE_INVESTIGATE_AREA,
  CHOICE_LOOK_AROUND,
  CHOICE_MOVE_FOREST,
  CHOICE_MOVE_GUILD,
  CHOICE_REST_INN,
  CHOICE_TALK_SERIA,
} from '../world/locations/location-story-choices';
import { CHOICE_FIGHT_GUARDIAN, STORY_SCENE_ID } from '../story/story-scene-definitions';
import { getCurrentScene } from '../story/story-scene-resolver';
import { getAvailableChoices } from '../story/story-choice-service';
import { getMainObjectiveText, CHAPTER_ID, isChapterCompleted } from '../story/chapters';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { CHOICE_REPORT_RUINS } from '../quests/quest-story-choices';
import { buildNpcDialogueContext } from '../npc/build-dialogue-context';
import { buildStoryDirectorContext } from '../story/choices';
import { createMemoryStorage, createSaveService, migrateSaveData, SAVE_VERSION } from '../save';
import { BOSS_ID, BOSS_INSTANCE_ID } from '../combat/boss/boss-types';
import { toStoryScreenView } from '../story/story-view';
import { runStep31FlowScenarios } from './step31-scenarios';

function victory(combatId: string, enemies: string[]) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 40 },
    defeatedEnemyIds: enemies,
    defeatedEnemyTypes: enemies.map(() => 'goblin'),
  };
}

async function playChapter1() {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'NEW_GAME', name: '옥토' });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_adventurer' });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_AREA });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.RUINS_MIXED_01, ['goblin_001', 'goblin_002', 'archer_001']),
  });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_ALTAR });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_LOOK_AROUND });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_FIGHT_GUARDIAN });
  if (orch.getState().mode === 'COMBAT') {
    await orch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: {
        combatId: ENCOUNTER_ID.RUINS_BOSS_01,
        outcome: 'VICTORY',
        player: { remainingHp: 70, remainingMp: 30 },
        defeatedEnemyIds: [BOSS_INSTANCE_ID.RUINS_GUARDIAN],
        defeatedEnemyTypes: [BOSS_ID.RUINS_GUARDIAN],
      },
    });
  }
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REPORT_RUINS });
  return orch;
}

function boostToLevel(state: ReturnType<typeof createInitialGameState>, level: number) {
  let current = state;
  while ((current.player.level ?? 1) < level) {
    const events = eventsForExpGrant(current, 200, `test-boost-${current.player.level}-${current.player.exp}`, 'ACTION');
    if (events.length === 0) {
      break;
    }
    current = applyEvents(current, events);
  }
  return current;
}

export async function runStep315FlowScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const fresh = createInitialGameState();
  if (
    fresh.player.classId === PLAYER_CLASS_ID.ADVENTURER &&
    fresh.player.level === 1 &&
    formatClock(fresh.world.totalMinutes) === 'DAY 1 · 08:00'
  ) {
    pass('A-new-game', `${fresh.player.classId} ${formatClock(fresh.world.totalMinutes)}`);
  } else {
    fail('A-new-game', JSON.stringify({ classId: fresh.player.classId, clock: formatClock(fresh.world.totalMinutes) }));
  }

  const orchB = createGameOrchestrator(createInitialGameState());
  await orchB.dispatch({ type: 'NEW_GAME', name: '아렌' });
  const before = orchB.getState();
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_TALK_SERIA });
  const afterTalk = orchB.getState();
  if (
    afterTalk.world.totalMinutes > before.world.totalMinutes &&
    (afterTalk.player.exp ?? 0) > (before.player.exp ?? 0)
  ) {
    pass('B-first-choice', `${formatClock(afterTalk.world.totalMinutes)} exp ${afterTalk.player.exp}`);
  } else {
    fail('B-first-choice', JSON.stringify({ minutes: afterTalk.world.totalMinutes, exp: afterTalk.player.exp }));
  }

  const startMinutes = afterTalk.world.totalMinutes;
  const startExp = afterTalk.player.exp ?? 0;
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_MOVE_GUILD });
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_adventurer' });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_LOOK_AROUND });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_TALK_SERIA });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_AREA });
  const afterTen = orchB.getState();
  if (afterTen.world.totalMinutes > startMinutes + 40 && (afterTen.player.exp ?? 0) > startExp) {
    pass('C-ten-choices', `${formatClock(afterTen.world.totalMinutes)} exp ${afterTen.player.exp}`);
  } else {
    fail('C-ten-choices', JSON.stringify({ minutes: afterTen.world.totalMinutes, exp: afterTen.player.exp }));
  }

  const midnightBase = applyEvents(createInitialGameState(), [
    {
      type: 'TIME_ADVANCED',
      minutes: 1430 - 480,
      reason: 'STORY',
      sourceActionId: 'test-set-2350',
      previousTotalMinutes: 480,
      newTotalMinutes: 23 * 60 + 50,
    },
  ]);
  const midnightOrch = createGameOrchestrator(midnightBase);
  await midnightOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  const afterMidnight = midnightOrch.getState();
  if (afterMidnight.world.day === 2 && hourFromTotalMinutes(afterMidnight.world.totalMinutes) === 0) {
    pass('D-midnight', formatClock(afterMidnight.world.totalMinutes));
  } else {
    fail('D-midnight', formatClock(afterMidnight.world.totalMinutes));
  }

  const restSetup = createGameOrchestrator(createInitialGameState());
  await restSetup.dispatch({ type: 'NEW_GAME', name: '휴식' });
  await restSetup.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN });
  const atInn = restSetup.getState();
  const restBase = applyEvents(atInn, [
    {
      type: 'TIME_ADVANCED',
      minutes: 16 * 60 + 40 - atInn.world.totalMinutes,
      reason: 'STORY',
      sourceActionId: 'test-set-1640',
      previousTotalMinutes: atInn.world.totalMinutes,
      newTotalMinutes: 16 * 60 + 40,
    },
  ]);
  const restOrch = createGameOrchestrator(restBase);
  await restOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REST_INN });
  const rested = restOrch.getState();
  if (rested.world.day === 2 && hourFromTotalMinutes(rested.world.totalMinutes) === 8 && minuteFromTotalMinutes(rested.world.totalMinutes) === 0) {
    pass('E-rest', formatClock(rested.world.totalMinutes));
  } else {
    fail('E-rest', formatClock(rested.world.totalMinutes));
  }

  if (ACTION_TIME_COST.TALK === 10 && ACTION_TIME_COST.MOVE === 30 && ACTION_TIME_COST.INVESTIGATE === 20) {
    pass('F-costs', `talk ${ACTION_EXP.TALK} move ${ACTION_EXP.MOVE} investigate ${ACTION_EXP.INVESTIGATE}`);
  } else {
    fail('F-costs', JSON.stringify(ACTION_TIME_COST));
  }
  if (travelMinutesBetween(LOCATION_ID.LUEN_VILLAGE, LOCATION_ID.FOREST_ROAD) === 30) {
    pass('F-travel', 'village→forest 30');
  } else {
    fail('F-travel', String(travelMinutesBetween(LOCATION_ID.LUEN_VILLAGE, LOCATION_ID.FOREST_ROAD)));
  }

  const repeatOrch = createGameOrchestrator(createInitialGameState());
  await repeatOrch.dispatch({ type: 'NEW_GAME', name: '반복' });
  const exp0 = repeatOrch.getState().player.exp ?? 0;
  const turn1 = repeatOrch.getState().world.turn;
  await repeatOrch.dispatch({ type: 'FREE_ACTION', turnId: turn1, input: '주변을 살펴본다' });
  const firstLookExp = (repeatOrch.getState().player.exp ?? 0) - exp0;
  const turn2 = repeatOrch.getState().world.turn;
  await repeatOrch.dispatch({ type: 'FREE_ACTION', turnId: turn2, input: '주변을 살펴본다' });
  const secondLookExp = (repeatOrch.getState().player.exp ?? 0) - exp0 - firstLookExp;
  if (firstLookExp >= 1 && secondLookExp <= firstLookExp) {
    pass('G-repeat', `first ${firstLookExp} repeat ${secondLookExp}`);
  } else {
    fail('G-repeat', `first ${firstLookExp} repeat ${secondLookExp}`);
  }

  const slice = await playChapter1();
  const done = slice.getState();
  const chapterDone = isChapterCompleted(done, CHAPTER_ID.CHAPTER_1_LUEN_RUINS);
  if (chapterDone && done.player.level >= 3 && done.player.level <= 8) {
    pass('M-chapter1-level', `lv ${done.player.level} exp ${done.player.exp}`);
  } else {
    fail('M-chapter1-level', JSON.stringify({ chapterDone, level: done.player.level, exp: done.player.exp, scene: done.story.currentSceneId }));
  }

  const locked = { ...done, player: { ...done.player, level: 4 } };
  const ready = boostToLevel(done, 5);
  if (!canChooseFirstAdvancement(locked) && canChooseFirstAdvancement(ready) && !canChooseFirstAdvancement(createInitialGameState())) {
    pass('N-advancement-gate', `lv4 ${canChooseFirstAdvancement(locked)} lv5 ${canChooseFirstAdvancement(ready)}`);
  } else {
    fail('N-advancement-gate', JSON.stringify({ lv4: canChooseFirstAdvancement(locked), lv5: canChooseFirstAdvancement(ready) }));
  }

  const mageOrch = createGameOrchestrator(ready);
  await mageOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.MAGE });
  const mage = mageOrch.getState();
  const mageCombat = buildCombatConfig({ ...mage, mode: 'COMBAT', activeCombatId: ENCOUNTER_ID.RUINS_EASY_01 }, ENCOUNTER_ID.RUINS_EASY_01);
  if (mage.player.classId === PLAYER_CLASS_ID.MAGE && getSkillForSlot(PLAYER_CLASS_ID.MAGE, 'Q')?.name === 'Fireball' && mageCombat?.player.classId === 'mage') {
    pass('O-mage-kit', displayClassName(mage.player.classId, mage.player.classRankId));
  } else {
    fail('O-mage-kit', mage.player.classId);
  }

  const warriorState = boostToLevel(done, 5);
  const warriorOrch = createGameOrchestrator(warriorState);
  await warriorOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR });
  if (warriorOrch.getState().player.classId === PLAYER_CLASS_ID.WARRIOR && getPlayerClass(PLAYER_CLASS_ID.WARRIOR).combat.basicAttackId === 'warrior_slash') {
    pass('P-warrior-kit', '검사');
  } else {
    fail('P-warrior-kit', warriorOrch.getState().player.classId);
  }

  const rogueOrch = createGameOrchestrator(boostToLevel(done, 5));
  await rogueOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.ROGUE });
  if (rogueOrch.getState().player.classId === PLAYER_CLASS_ID.ROGUE && getSkillForSlot(PLAYER_CLASS_ID.ROGUE, 'Q')?.name === 'Shadow Dash') {
    pass('Q-rogue-kit', '도적');
  } else {
    fail('Q-rogue-kit', rogueOrch.getState().player.classId);
  }

  const view = toStoryScreenView(fresh);
  if (view.player.job === '모험가' && view.clock === 'DAY 1 · 08:00' && view.player.expToNext === 50 && view.player.stats.length >= 3) {
    pass('R-character-ui', `${view.player.job} ${view.clock}`);
  } else {
    fail('R-character-ui', JSON.stringify({ job: view.player.job, clock: view.clock, exp: view.player.expToNext }));
  }

  const ruinsScene = getCurrentScene(done);
  const mismatch =
    done.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE &&
    ruinsScene?.id !== STORY_SCENE_ID.ANCIENT_RUINS_ENEMY &&
    ruinsScene?.id !== STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS;
  if (mismatch && chapterDone) {
    pass('S-continuity', done.story.currentSceneId);
  } else {
    fail('S-continuity', `${done.story.currentSceneId} loc ${done.world.currentLocationId}`);
  }

  const beats = [
    STORY_SCENE_ID.LUEN_VILLAGE_INTRO,
    STORY_SCENE_ID.LUEN_GUILD,
    STORY_SCENE_ID.MARTA_FIRST_MEETING,
    STORY_SCENE_ID.LEON_FIRST_MEETING,
    STORY_SCENE_ID.SERIA_FIRST_MEETING,
    STORY_SCENE_ID.FOREST_TRACES,
    STORY_SCENE_ID.ANCIENT_RUINS_ENEMY,
    STORY_SCENE_ID.ANCIENT_RUINS_DISCOVERY,
    STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS,
    STORY_SCENE_ID.CHAPTER_1_COMPLETE,
    STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT,
  ];
  if (beats.every(Boolean) && beats.length >= 11) {
    pass('T-story-beats', String(beats.length));
  } else {
    fail('T-story-beats', String(beats.length));
  }

  const introChoices = getAvailableChoices(fresh);
  const objective = getMainObjectiveText(fresh);
  if (objective.includes('길드') && introChoices.some((choice) => choice.id === CHOICE_MOVE_GUILD || choice.id.includes('guild'))) {
    pass('U-objective-choice', objective);
  } else {
    fail('U-objective-choice', JSON.stringify({ objective, ids: introChoices.map((choice) => choice.id) }));
  }

  const freeOrch = createGameOrchestrator(createInitialGameState());
  await freeOrch.dispatch({ type: 'NEW_GAME', name: '자유' });
  const freeBefore = freeOrch.getState();
  await freeOrch.dispatch({ type: 'FREE_ACTION', turnId: freeBefore.world.turn, input: '주변을 살펴본다' });
  const freeAfter = freeOrch.getState();
  if (freeAfter.world.totalMinutes > freeBefore.world.totalMinutes && (freeAfter.player.exp ?? 0) >= (freeBefore.player.exp ?? 0)) {
    pass('V-free-action', `${formatClock(freeAfter.world.totalMinutes)} exp ${freeAfter.player.exp}`);
  } else {
    fail('V-free-action', JSON.stringify({ minutes: freeAfter.world.totalMinutes, exp: freeAfter.player.exp, resolution: freeAfter.lastActionResolution }));
  }

  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(mage, undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const loadOrch = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storage) });
  await loadOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = loadOrch.getState();
  if (
    loaded.player.classId === PLAYER_CLASS_ID.MAGE &&
    loaded.player.level === mage.player.level &&
    loaded.world.totalMinutes === mage.world.totalMinutes
  ) {
    pass('W-save-load', `${loaded.player.classId} ${formatClock(loaded.world.totalMinutes)}`);
  } else {
    fail('W-save-load', JSON.stringify({ classId: loaded.player.classId, minutes: loaded.world.totalMinutes }));
  }

  const oldWarrior = {
    version: 1,
    saveId: 'old-warrior',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    playTimeSeconds: 12,
    gameState: {
      ...createInitialGameState({ classId: PLAYER_CLASS_ID.WARRIOR }),
    },
  };
  const migrated = migrateSaveData(oldWarrior);
  if (migrated && migrated.version === SAVE_VERSION && migrated.gameState.player.classId === PLAYER_CLASS_ID.WARRIOR) {
    pass('X-old-save', migrated.gameState.player.classId);
  } else {
    fail('X-old-save', migrated?.gameState.player.classId ?? 'null');
  }

  const npcContext = buildNpcDialogueContext(afterTalk, 'seria', '지금 몇 시지?');
  const director = buildStoryDirectorContext(afterTalk);
  if (npcContext?.clock && npcContext.timeOfDay && director.clock && director.player.classDisplay === '모험가') {
    pass('Y-groq-context', `${npcContext.clock} ${director.player.classDisplay}`);
  } else {
    fail('Y-groq-context', JSON.stringify({ npc: npcContext?.clock, director: director.clock, job: director.player.classDisplay }));
  }

  if (COMBAT_TIME_COST.ENCOUNTER === 30 && COMBAT_TIME_COST.BOSS === 50 && ACTION_EXP.QUEST_PROGRESS === 15) {
    pass('J-combat-time-config', `encounter ${COMBAT_TIME_COST.ENCOUNTER} boss ${COMBAT_TIME_COST.BOSS}`);
  } else {
    fail('J-combat-time-config', JSON.stringify(COMBAT_TIME_COST));
  }

  if (dayFromTotalMinutes(1440) === 2) {
    pass('D-day-derive', '1440 → day 2');
  } else {
    fail('D-day-derive', String(dayFromTotalMinutes(1440)));
  }

  const regression = await runStep31FlowScenarios();
  const failed = regression.filter((line) => line.startsWith('FAIL'));
  if (failed.length === 0) {
    pass('Z-regression-step31', `${regression.filter((line) => line.startsWith('PASS')).length} passed`);
  } else {
    fail('Z-regression-step31', failed.join(' | '));
  }

  return lines;
}
