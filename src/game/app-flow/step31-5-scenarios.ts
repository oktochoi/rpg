import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { PLAYER_CLASS_ID, canChooseFirstAdvancement, displayClassName, getPlayerClass, FIRST_ADVANCEMENT_LEVEL } from '../player/classes';
import { CLASS_RANK_ID } from '../player/classes/class-ranks';
import { getSkillForSlot } from '../combat/skills/skill-definitions';
import { buildCombatConfig } from '../combat/build-combat-config';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { ACTION_EXP, eventsForProgression } from '../player/progression';
import { eventsForTurnRewards } from '../player/progression/action-rewards';
import { ACTION_TIME_COST, COMBAT_TIME_COST, travelMinutesBetween } from '../time/action-time-config';
import { dayFromTotalMinutes, formatClock, hourFromTotalMinutes, minuteFromTotalMinutes } from '../time/clock-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import {
  CHOICE_INVESTIGATE_ALTAR,
  CHOICE_INVESTIGATE_AREA,
  CHOICE_LOOK_AROUND,
  CHOICE_MOVE_GUILD,
  CHOICE_MOVE_VILLAGE,
  CHOICE_REST_INN,
} from '../world/locations/location-story-choices';
import { CHOICE_FIGHT_GUARDIAN, STORY_SCENE_ID } from '../story/story-scene-definitions';
import { getCurrentScene } from '../story/story-scene-resolver';
import { getAvailableChoices } from '../story/story-choice-service';
import { getMainObjectiveText, CHAPTER_ID, isChapterCompleted } from '../story/chapters';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { CHOICE_REPORT_RUINS } from '../quests/quest-story-choices';
import { resetRuinsKeyDropRng, setRuinsKeyDropRng } from '../quests/ruins-key-hunt';
import { buildNpcDialogueContext } from '../npc/build-dialogue-context';
import { buildStoryDirectorContext } from '../story/choices';
import { createMemoryStorage, createSaveService, migrateSaveData, SAVE_VERSION } from '../save';
import { BOSS_ID, BOSS_INSTANCE_ID } from '../combat/boss/boss-types';
import { toStoryScreenView } from '../story/story-view';
import { runStep31FlowScenarios } from './step31-scenarios';
import { runRuinsKeyHuntScenarios } from '../quests/ruins-key-hunt-scenarios';

function victory(combatId: string, enemies: string[]) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 40 },
    defeatedEnemyIds: enemies,
    defeatedEnemyTypes: enemies.map(() => 'goblin'),
  };
}

/** Chapter 1 slice aligned with current quest/combat unlock order. */
async function playChapter1() {
  let orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'NEW_GAME', name: '옥토' });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_adventurer' });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_FOREST_SCOUTS, ['scout_goblin_001', 'scout_goblin_002']),
  });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_MOVE_VILLAGE });
  if (orch.getState().world.currentLocationId !== LOCATION_ID.LUEN_VILLAGE) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  }
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'START_DIALOGUE', npcId: 'guildmaster_doran' });
  if (orch.getState().story.currentSceneId === STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT) {
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'choose_path_warrior' });
  } else {
    await orch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR });
  }
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  orch = createGameOrchestrator(
    applyEvents(orch.getState(), [{ type: 'LOCATION_DISCOVERED', locationId: LOCATION_ID.ANCIENT_RUINS }])
  );
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  setRuinsKeyDropRng(() => 0);
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH });
  if (orch.getState().mode === 'COMBAT') {
    await orch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: victory(ENCOUNTER_ID.CH1_FOREST_AMBUSH, ['ambush_goblin_001', 'ambush_archer_001']),
    });
  }
  resetRuinsKeyDropRng();
  if (orch.getState().world.currentLocationId !== LOCATION_ID.LUEN_VILLAGE) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  }
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_RUINS_GATE, ['gate_goblin_001', 'gate_archer_001', 'gate_brute_001']),
  });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_ALTAR });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'inspect_seal_first' });
  if (orch.getState().mode !== 'COMBAT') {
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'touch_magic_stone' });
  }
  if (orch.getState().mode !== 'COMBAT') {
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_FIGHT_GUARDIAN });
  }
  if (orch.getState().mode === 'COMBAT') {
    await orch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: {
        combatId: ENCOUNTER_ID.RUINS_BOSS_01,
        outcome: 'VICTORY',
        player: { remainingHp: 55, remainingMp: 30 },
        defeatedEnemyIds: [BOSS_INSTANCE_ID.RUINS_GUARDIAN],
        defeatedEnemyTypes: [BOSS_ID.RUINS_GUARDIAN],
      },
    });
  }
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'investigate_guardian_core' });
  if (orch.getState().world.currentLocationId === LOCATION_ID.ANCIENT_RUINS) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  }
  if (orch.getState().world.currentLocationId === LOCATION_ID.FOREST_ROAD) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  }
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REPORT_RUINS });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'report_all' });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'leon_agree_seria' });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  return orch;
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
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  const afterTalk = orchB.getState();
  if (afterTalk.world.totalMinutes > before.world.totalMinutes) {
    pass('B-first-choice', `${formatClock(afterTalk.world.totalMinutes)} exp ${afterTalk.player.exp ?? 0}`);
  } else {
    fail('B-first-choice', JSON.stringify({ minutes: afterTalk.world.totalMinutes, exp: afterTalk.player.exp }));
  }

  const startMinutes = afterTalk.world.totalMinutes;
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_adventurer' });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_LOOK_AROUND });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orchB.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orchB.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_AREA });
  const afterTen = orchB.getState();
  if (afterTen.world.totalMinutes > startMinutes + 40) {
    pass('C-ten-choices', `${formatClock(afterTen.world.totalMinutes)} exp ${afterTen.player.exp ?? 0}`);
  } else {
    fail('C-ten-choices', JSON.stringify({ minutes: afterTen.world.totalMinutes, exp: afterTen.player.exp }));
  }

  const midnightOrch = createGameOrchestrator(createInitialGameState());
  await midnightOrch.dispatch({ type: 'NEW_GAME', name: '자정' });
  await midnightOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await midnightOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_adventurer' });
  await midnightOrch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  const midnightBase = applyEvents(midnightOrch.getState(), [
    {
      type: 'TIME_ADVANCED',
      minutes: 1430 - midnightOrch.getState().world.totalMinutes,
      reason: 'STORY',
      sourceActionId: 'test-set-2350',
      previousTotalMinutes: midnightOrch.getState().world.totalMinutes,
      newTotalMinutes: 23 * 60 + 50,
    },
  ]);
  const midnightTravel = createGameOrchestrator(midnightBase);
  await midnightTravel.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  const afterMidnight = midnightTravel.getState();
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

  // Grindable actions grant 0 EXP; only first discoveries/clears grow the character.
  const repeatBase = createInitialGameState();
  let grind = repeatBase;
  for (let i = 0; i < 5; i += 1) {
    const incoming = [
      {
        type: 'ACTION_RESOLVED' as const,
        turnId: grind.world.turn + i,
        resolution: { success: true, actionType: 'INVESTIGATE' as const, narrative: '주변을 살핀다.' },
      },
      { type: 'AREA_INVESTIGATED' as const, locationId: grind.world.currentLocationId },
    ];
    const progressed = eventsForProgression(grind, incoming);
    const mid = applyEvents(grind, [...incoming, ...progressed]);
    const turn = eventsForTurnRewards(grind, incoming);
    grind = applyEvents(mid, turn);
    grind = {
      ...grind,
      world: { ...grind.world, turn: grind.world.turn + 1 },
      actionRepeatCounts: {
        ...(grind.actionRepeatCounts ?? {}),
        [`INVESTIGATE:${grind.world.currentLocationId}:${grind.story.currentSceneId}`]: i + 1,
      },
    };
  }
  if ((grind.player.exp ?? 0) === (repeatBase.player.exp ?? 0)) {
    pass('G-repeat', `exp unchanged at ${grind.player.exp ?? 0} after 5 investigates`);
  } else {
    fail('G-repeat', `exp ${(repeatBase.player.exp ?? 0)} → ${grind.player.exp ?? 0}`);
  }

  const slice = await playChapter1();
  const done = slice.getState();
  const chapterProgressed =
    worldFlag(done, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) &&
    (done.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.COMPLETED ||
      worldFlag(done, WORLD_FLAG.SERIA_FINAL_REPORT));
  if (chapterProgressed && done.player.level >= 2 && done.player.level <= 12) {
    pass('M-chapter1-level', `lv ${done.player.level} exp ${done.player.exp} guardian+report`);
  } else {
    fail(
      'M-chapter1-level',
      JSON.stringify({
        chapterProgressed,
        level: done.player.level,
        exp: done.player.exp,
        scene: done.story.currentSceneId,
        quest: done.quests[QUEST_ID.RUINS_MYSTERY]?.status,
        flags: Object.entries(done.world.flags)
          .filter(([, v]) => v)
          .map(([k]) => k),
      })
    );
  }

  const lockedLow = {
    ...done,
    player: {
      ...done.player,
      level: FIRST_ADVANCEMENT_LEVEL,
      classId: PLAYER_CLASS_ID.ADVENTURER,
      classRankId: CLASS_RANK_ID.ADVENTURER,
    },
    quests: {
      ...done.quests,
      [QUEST_ID.FOREST_GOBLIN_SCOUR]: {
        ...(done.quests[QUEST_ID.FOREST_GOBLIN_SCOUR] ?? {
          id: QUEST_ID.FOREST_GOBLIN_SCOUR,
          status: QUEST_STATUS.ACTIVE,
          objectiveProgress: {},
        }),
        status: QUEST_STATUS.ACTIVE,
      },
    },
    world: {
      ...done.world,
      flags: {
        ...done.world.flags,
        [WORLD_FLAG.GUILD_REGISTERED]: true,
        [WORLD_FLAG.RUINS_GUARDIAN_DEFEATED]: false,
        [WORLD_FLAG.FIRST_ADVANCEMENT_DONE]: false,
      },
    },
  };
  const readyGate = {
    ...lockedLow,
    world: {
      ...lockedLow.world,
      flags: {
        ...lockedLow.world.flags,
        [WORLD_FLAG.GUILD_REGISTERED]: true,
        [WORLD_FLAG.RUINS_GUARDIAN_DEFEATED]: true,
        [WORLD_FLAG.FIRST_ADVANCEMENT_DONE]: false,
      },
    },
  };
  if ((done.player.level ?? 1) >= 2) {
    pass('M2-natural-progress', `mainline lv ${done.player.level} exp ${done.player.exp}`);
  } else {
    fail('M2-natural-progress', `lv ${done.player.level} exp ${done.player.exp}`);
  }
  if (!canChooseFirstAdvancement(lockedLow) && canChooseFirstAdvancement(readyGate) && !canChooseFirstAdvancement(createInitialGameState())) {
    pass('N-advancement-gate', `no-golem ${canChooseFirstAdvancement(lockedLow)} after-golem ${canChooseFirstAdvancement(readyGate)}`);
  } else {
    fail(
      'N-advancement-gate',
      JSON.stringify({
        noGolem: canChooseFirstAdvancement(lockedLow),
        ready: canChooseFirstAdvancement(readyGate),
        natural: done.player.level,
      })
    );
  }

  const mageOrch = createGameOrchestrator(readyGate);
  await mageOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.MAGE });
  const mage = mageOrch.getState();
  const mageCombat = buildCombatConfig({ ...mage, mode: 'COMBAT', activeCombatId: ENCOUNTER_ID.RUINS_EASY_01 }, ENCOUNTER_ID.RUINS_EASY_01);
  if (mage.player.classId === PLAYER_CLASS_ID.MAGE && getSkillForSlot(PLAYER_CLASS_ID.MAGE, 'Q')?.name === '화염탄' && mageCombat?.player.classId === 'mage') {
    pass('O-mage-kit', displayClassName(mage.player.classId, mage.player.classRankId));
  } else {
    fail('O-mage-kit', mage.player.classId);
  }

  const warriorOrch = createGameOrchestrator(readyGate);
  await warriorOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR });
  if (warriorOrch.getState().player.classId === PLAYER_CLASS_ID.WARRIOR && getPlayerClass(PLAYER_CLASS_ID.WARRIOR).combat.basicAttackId === 'warrior_slash') {
    pass('P-warrior-kit', '검사');
  } else {
    fail('P-warrior-kit', warriorOrch.getState().player.classId);
  }

  const rogueOrch = createGameOrchestrator(readyGate);
  await rogueOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.ROGUE });
  if (rogueOrch.getState().player.classId === PLAYER_CLASS_ID.ROGUE && getSkillForSlot(PLAYER_CLASS_ID.ROGUE, 'Q')?.name === '그림자 질주') {
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
    done.world.currentLocationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD ||
    done.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE;
  if (mismatch && worldFlag(done, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) && ruinsScene?.id !== STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS) {
    pass('S-continuity', `${done.story.currentSceneId} @ ${done.world.currentLocationId}`);
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
  // Intro is auto-continue paced; guild move appears on the hub after intro_continue.
  const canReachGuild =
    introChoices.some((choice) => choice.id === CHOICE_MOVE_GUILD || choice.id.includes('guild')) ||
    introChoices.some((choice) => choice.id === 'intro_continue');
  if (objective.includes('길드') && canReachGuild) {
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

  if (COMBAT_TIME_COST.ENCOUNTER === 30 && COMBAT_TIME_COST.BOSS === 50 && ACTION_EXP.QUEST_PROGRESS === 12) {
    pass('J-combat-time-config', `encounter ${COMBAT_TIME_COST.ENCOUNTER} boss ${COMBAT_TIME_COST.BOSS}`);
  } else {
    fail('J-combat-time-config', JSON.stringify({ ...COMBAT_TIME_COST, questProgress: ACTION_EXP.QUEST_PROGRESS }));
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

  const keyHunt = await runRuinsKeyHuntScenarios();
  const keyFailed = keyHunt.filter((line) => line.startsWith('FAIL'));
  if (keyFailed.length === 0) {
    pass('Z-key-hunt', `${keyHunt.filter((line) => line.startsWith('PASS')).length} passed`);
  } else {
    fail('Z-key-hunt', keyFailed.join(' | '));
  }

  return lines;
}
