import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { APP_PHASE, sanitizePlayerName } from './app-flow-types';
import { PLAYER_CLASS_ID, displayClassName, nextAdvancementFor } from '../player/classes';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { CHAPTER_ID, currentChapterId, getMainObjectiveText, isChapterCompleted } from '../story/chapters';
import { CHOICE_LOOK_AROUND, CHOICE_REST_INN, CHOICE_TALK_SERIA, CHOICE_INVESTIGATE_ALTAR } from '../world/locations/location-story-choices';
import {
  CHOICE_FIGHT_GUARDIAN,
  STORY_SCENE_ID,
} from '../story/story-scene-definitions';
import { toStoryScreenView } from '../story/story-view';
import { createMemoryStorage, createSaveService, migrateSaveData, SAVE_VERSION } from '../save';
import { ITEM_ID } from '../inventory';
import { isGameDebugEnabled } from '../debug/debug-flags';
import { buildNpcDialogueContext } from '../npc/build-dialogue-context';
import { CHOICE_REPORT_RUINS } from '../quests/quest-story-choices';
import { BOSS_ID, BOSS_INSTANCE_ID } from '../combat/boss/boss-types';
import type { HistoryEntry } from '../history/history-types';

function victory(combatId: string, enemies: string[]) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 40 },
    defeatedEnemyIds: enemies,
    defeatedEnemyTypes: enemies.map(() => 'goblin'),
  };
}

async function playChapter1(name = '옥토') {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'NEW_GAME', name });
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
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

export async function runStep31FlowScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  if (APP_PHASE.TITLE === 'TITLE' && APP_PHASE.CHARACTER_CREATION === 'CHARACTER_CREATION' && APP_PHASE.GAME === 'GAME') {
    pass('A-title-phase', 'AppPhase separated from GameMode');
  } else {
    fail('A-title-phase', 'missing phases');
  }

  if (sanitizePlayerName(' 옥토 ') === '옥토' && sanitizePlayerName('') === null && sanitizePlayerName('abcdefghijklmnopq') === null) {
    pass('C-name-rules', '1-16 trimmed');
  } else {
    fail('C-name-rules', String(sanitizePlayerName(' 옥토 ')));
  }

  const orchC = createGameOrchestrator(createInitialGameState());
  await orchC.dispatch({ type: 'NEW_GAME', name: '옥토' });
  const created = orchC.getState();
  if (
    created.player.name === '옥토' &&
    created.player.classId === PLAYER_CLASS_ID.ADVENTURER &&
    created.player.level === 1 &&
    created.player.exp === 0 &&
    created.world.day === 1 &&
    created.world.totalMinutes === 8 * 60 &&
    currentChapterId(created) === CHAPTER_ID.CHAPTER_1_LUEN_RUINS &&
    created.story.currentSceneId === STORY_SCENE_ID.LUEN_VILLAGE_INTRO
  ) {
    pass('C-create', `${created.player.name}/${created.player.classId}/day ${created.world.day}`);
  } else {
    fail('C-create', JSON.stringify({ name: created.player.name, classId: created.player.classId, day: created.world.day, minutes: created.world.totalMinutes, scene: created.story.currentSceneId }));
  }

  const view = toStoryScreenView(created);
  if (view.day === 1 && view.player.level === 1 && view.chapterTitle?.includes('폐허')) {
    pass('D-intro-ui', `${view.day}/${view.chapterTitle}`);
  } else {
    fail('D-intro-ui', `${view.day}/${view.chapterTitle}`);
  }

  const npcContext = buildNpcDialogueContext(created, 'seria', '폐허는 어떤가?');
  if (npcContext?.playerName === '옥토' && npcContext.day === 1) {
    pass('E-name-context', npcContext.playerName);
  } else {
    fail('E-name-context', npcContext?.playerName ?? 'none');
  }

  await orchC.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN });
  const beforeRestDay = orchC.getState().world.day;
  await orchC.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REST_INN });
  const afterRest = orchC.getState();
  if (afterRest.world.day === beforeRestDay + 1 && afterRest.player.currentHp === afterRest.player.maxHp) {
    pass('F-rest', `day ${afterRest.world.day}`);
  } else {
    fail('F-rest', `day ${afterRest.world.day} from ${beforeRestDay}`);
  }

  const talkDay = afterRest.world.day;
  await orchC.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_TALK_SERIA });
  await orchC.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  if (orchC.getState().world.day === talkDay) {
    pass('G-no-false-day', String(talkDay));
  } else {
    fail('G-no-false-day', String(orchC.getState().world.day));
  }

  if (getMainObjectiveText(created).includes('길드')) {
    pass('H-chapter-objective', getMainObjectiveText(created));
  } else {
    fail('H-chapter-objective', getMainObjectiveText(created));
  }

  const slice = await playChapter1();
  const done = slice.getState();
  const chapterDone = isChapterCompleted(done, CHAPTER_ID.CHAPTER_1_LUEN_RUINS);
  const gateOpen = done.world.flags[WORLD_FLAG.NORTHERN_GATE_OPEN] === true;
  if (chapterDone && gateOpen && done.player.level >= 2 && done.player.level <= 6) {
    pass('J-chapter-complete', `lv ${done.player.level} / gate ${gateOpen}`);
  } else {
    fail(
      'J-chapter-complete',
      JSON.stringify({
        chapterDone,
        gateOpen,
        level: done.player.level,
        exp: done.player.exp,
        quest: done.quests[QUEST_ID.RUINS_MYSTERY]?.status,
        flags: done.world.flags,
      })
    );
  }

  if (done.player.level > 1) {
    pass('K-exp', `lv ${done.player.level} exp ${done.player.exp}`);
  } else {
    fail('K-exp', `lv ${done.player.level}`);
  }

  const next = nextAdvancementFor(PLAYER_CLASS_ID.ADVENTURER, done.player.classRankId);
  if (displayClassName(done.player.classId, done.player.classRankId) === '모험가' && next?.levelRequirement === 5) {
    pass('L-rank-ui', `${displayClassName(done.player.classId, done.player.classRankId)} → lv${next.levelRequirement}`);
  } else {
    fail('L-rank-ui', displayClassName(done.player.classId, done.player.classRankId));
  }

  if (
    (done.history ?? []).some((item: HistoryEntry) => item.kind === 'ARRIVAL') &&
    (done.history ?? []).every((item: HistoryEntry) => item.summary && !item.summary.includes('{'))
  ) {
    pass('Q-history', String(done.history.length));
  } else {
    fail('Q-history', JSON.stringify(done.history?.slice(0, 3)));
  }

  if (!isGameDebugEnabled()) {
    pass('R-debug-hidden', 'no explicit flag');
  } else {
    fail('R-debug-hidden', 'debug on');
  }

  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(done, undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const loadOrch = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storage) });
  await loadOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = loadOrch.getState();
  if (
    loaded.player.name === '옥토' &&
    loaded.player.level === done.player.level &&
    loaded.world.day === done.world.day &&
    loaded.story.currentChapterId === done.story.currentChapterId
  ) {
    pass('S-save-load', `lv ${loaded.player.level} day ${loaded.world.day}`);
  } else {
    fail('S-save-load', JSON.stringify({ name: loaded.player.name, level: loaded.player.level, day: loaded.world.day }));
  }

  const oldSave = {
    version: 1,
    saveId: 'old',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    playTimeSeconds: 12,
    gameState: {
      meta: { playTimeSeconds: 12 },
      mode: 'STORY',
      activeCombatId: null,
      pendingFreeActionTurnId: null,
      lastActionResolution: null,
      processedRelationshipSourceIds: [],
      processedMemorySourceIds: [],
      player: createInitialGameState().player,
      world: { ...createInitialGameState().world },
      npcs: createInitialGameState().npcs,
      relationships: createInitialGameState().relationships,
      quests: createInitialGameState().quests,
      knowledge: createInitialGameState().knowledge,
      npcMemories: createInitialGameState().npcMemories,
      story: createInitialGameState().story,
      history: [],
    },
  };
  delete (oldSave.gameState.player as { level?: number }).level;
  delete (oldSave.gameState.world as { day?: number }).day;
  const migrated = migrateSaveData(oldSave);
  if (migrated && migrated.version === SAVE_VERSION && migrated.gameState.player.level >= 1 && migrated.gameState.world.day >= 1) {
    pass('T-old-save', `v${migrated.version} lv ${migrated.gameState.player.level}`);
  } else {
    fail('T-old-save', migrated ? JSON.stringify({ v: migrated.version, lv: migrated.gameState.player.level }) : 'null');
  }

  const potionState = applyEvents(createInitialGameState({ name: '옥토', classId: PLAYER_CLASS_ID.WARRIOR }), [
    { type: 'ITEM_RECEIVED', itemId: ITEM_ID.HEALING_POTION },
    { type: 'PLAYER_COMBAT_HP_UPDATED', currentHp: 40 },
  ]);
  const potionOrch = createGameOrchestrator(potionState);
  await potionOrch.dispatch({ type: 'USE_ITEM', itemId: ITEM_ID.HEALING_POTION });
  const afterPotion = potionOrch.getState();
  if (afterPotion.player.currentHp > 40 && afterPotion.player.inventory.some((item) => item.itemId === ITEM_ID.HEALING_POTION)) {
    pass('N-inventory-use', `hp ${afterPotion.player.currentHp}`);
  } else {
    fail('N-inventory-use', `hp ${afterPotion.player.currentHp} inv ${afterPotion.player.inventory.length}`);
  }

  if (done.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.COMPLETED || chapterDone) {
    pass('V-playable-flow', 'chapter 1 path resolved');
  } else {
    fail('V-playable-flow', done.quests[QUEST_ID.RUINS_MYSTERY]?.status ?? 'none');
  }

  return lines;
}
