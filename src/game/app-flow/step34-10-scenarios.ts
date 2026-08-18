import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { generateStoryChoices } from '../../ai/director/generate-story-choices';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { getLocationDefinition, LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { hubTravelDestinations, worldFlag } from '../world/locations/location-selectors';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { ITEM_ID } from '../inventory/item-definitions';
import { getMainObjectiveText } from '../story/chapters/main-objective';
import { productionTextHasInternalId } from '../story/choices/choice-label';
import { STORY_SCENE_ID } from '../story/story-scene-definitions';
import { toStoryScreenView } from '../story/story-view';
import { INN_REST_COST } from '../economy/economy-types';
import { PLAYER_CLASS_ID, canChooseFirstAdvancement } from '../player/classes';
import { playOrganicChapter1 } from './step34-scenarios';
import { CHAPTER_ID, isChapterCompleted } from '../story/chapters';
import { CHOICE_INVESTIGATE_ALTAR, CHOICE_LOOK_AROUND, CHOICE_REST_INN } from '../world/locations/location-story-choices';
import { CHOICE_REPORT_RUINS } from '../quests/quest-story-choices';
import { BOSS_INSTANCE_ID, BOSS_ID } from '../combat/boss/boss-types';
import { createMemoryStorage, createSaveService } from '../save';
import { getQuestDefinition } from '../quests/quest-definitions';

function victory(combatId: string, enemies: string[]) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 40 },
    defeatedEnemyIds: enemies,
    defeatedEnemyTypes: enemies.map(() => 'goblin'),
  };
}

function pathBetween(start: string, dest: string): string[] {
  if (start === dest) {
    return [];
  }
  const prev = new Map<string, string | null>([[start, null]]);
  const queue = [start];
  while (queue.length > 0) {
    const cursor = queue.shift()!;
    const definition = getLocationDefinition(cursor);
    if (!definition) {
      continue;
    }
    for (const next of definition.connectedLocationIds) {
      if (prev.has(next)) {
        continue;
      }
      prev.set(next, cursor);
      if (next === dest) {
        const path: string[] = [];
        let walk: string | null = dest;
        while (walk && walk !== start) {
          path.unshift(walk);
          walk = prev.get(walk) ?? null;
        }
        return path;
      }
      queue.push(next);
    }
  }
  return [];
}

async function hopTo(orch: ReturnType<typeof createGameOrchestrator>, locationId: string) {
  for (const hop of pathBetween(orch.getState().world.currentLocationId, locationId)) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: hop });
  }
}

function playerFacingBlob(
  orch: ReturnType<typeof createGameOrchestrator>,
  choiceTexts: readonly string[]
): string {
  const view = toStoryScreenView(orch.getState());
  return [
    ...choiceTexts,
    view.mainObjective ?? '',
    view.story.npcDialogue,
    view.story.situation,
    view.quest.title,
    view.quest.summary,
    view.quest.currentObjective ?? '',
    ...view.quest.objectives.map((item) => item.description),
    ...view.relations.map((item) => `${item.npcName} ${item.relation}`),
    ...hubTravelDestinations(orch.getState()).map((id) => getLocationDefinition(id)?.name ?? ''),
  ].join('\n');
}

export async function runStep3410Scenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'NEW_GAME', name: '플레이테스트' });
  const beforeContinue = orch.getState();
  const intro = await generateStoryChoices(beforeContinue);
  const introExp = beforeContinue.player.exp ?? 0;
  const introMinutes = beforeContinue.world.totalMinutes ?? 0;
  if (
    intro.choices.length === 1 &&
    intro.choices[0]?.text === '계속' &&
    getMainObjectiveText(beforeContinue).includes('길드')
  ) {
    pass('A-arrival-continue', getMainObjectiveText(beforeContinue));
  } else {
    fail('A-arrival-continue', `${intro.choices.map((item) => item.text).join('|')} / ${getMainObjectiveText(beforeContinue)}`);
  }

  await orch.dispatch({ type: 'CONTINUE_STORY' });
  const afterContinue = orch.getState();
  if (
    afterContinue.story.currentSceneId === STORY_SCENE_ID.LUEN_VILLAGE_HUB &&
    (afterContinue.player.exp ?? 0) === introExp &&
    (afterContinue.world.totalMinutes ?? 0) === introMinutes
  ) {
    pass('B-continue-no-cost', `exp ${afterContinue.player.exp} min ${afterContinue.world.totalMinutes}`);
  } else {
    fail('B-continue-no-cost', `exp ${afterContinue.player.exp} min ${afterContinue.world.totalMinutes} scene ${afterContinue.story.currentSceneId}`);
  }

  const hubIds = hubTravelDestinations(afterContinue);
  if (
    hubIds.includes(LOCATION_ID.LUEN_ADVENTURERS_GUILD) &&
    hubIds.includes(LOCATION_ID.BLUE_MOON_INN) &&
    hubIds.includes(LOCATION_ID.LUEN_GENERAL_STORE) &&
    !hubIds.includes(LOCATION_ID.FOREST_ROAD)
  ) {
    pass('C-hub-start', hubIds.join(','));
  } else {
    fail('C-hub-start', hubIds.join(','));
  }

  await hopTo(orch, LOCATION_ID.BLUE_MOON_INN);
  const innChoices = await generateStoryChoices(orch.getState());
  if (
    orch.getState().world.currentLocationId === LOCATION_ID.BLUE_MOON_INN &&
    innChoices.choices.some((choice) => /쉰다|휴식/.test(choice.text))
  ) {
    pass('D-inn-rest-choice', innChoices.choices.map((choice) => choice.text).join('|'));
  } else {
    fail('D-inn-rest-choice', innChoices.choices.map((choice) => choice.text).join('|'));
  }

  await hopTo(orch, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  const firstGuild = await generateStoryChoices(orch.getState());
  const roleplay = firstGuild.choices.filter((choice) => /없다고 말한다|있다고 말한다|자신 있다고/.test(choice.text));
  if (worldFlag(orch.getState(), WORLD_FLAG.GUILD_REGISTERED) && roleplay.length >= 1) {
    pass('E-register-roleplay', roleplay.map((choice) => choice.text).join('|'));
  } else {
    fail('E-register-roleplay', firstGuild.choices.map((choice) => choice.text).join('|'));
  }

  await hopTo(orch, LOCATION_ID.LUEN_VILLAGE);
  await hopTo(orch, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  const secondGuild = await generateStoryChoices(orch.getState());
  const repeated = secondGuild.choices.filter((choice) => /없다고 말한다|있다고 말한다|자신 있다고/.test(choice.text));
  if (repeated.length === 0) {
    pass('F-register-no-repeat', secondGuild.choices.map((choice) => choice.text).join('|'));
  } else {
    fail('F-register-no-repeat', secondGuild.choices.map((choice) => choice.text).join('|'));
  }

  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  if (orch.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status === QUEST_STATUS.ACTIVE) {
    pass('G-starter-quest', getMainObjectiveText(orch.getState()));
  } else {
    fail('G-starter-quest', orch.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status ?? 'none');
  }

  const villageAfterRegister = { ...orch.getState() };
  void villageAfterRegister;
  await hopTo(orch, LOCATION_ID.LUEN_VILLAGE);
  const afterForestUnlock = hubTravelDestinations(orch.getState());
  if (afterForestUnlock.includes(LOCATION_ID.FOREST_ROAD)) {
    pass('H-forest-unlock', afterForestUnlock.join(','));
  } else {
    fail('H-forest-unlock', afterForestUnlock.join(','));
  }

  await hopTo(orch, LOCATION_ID.FOREST_ROAD);
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_FOREST_SCOUTS, ['scout_goblin_001', 'scout_goblin_002']),
  });
  const leveled = orch.getState();
  if ((leveled.player.unspentStatPoints ?? 0) >= 1) {
    const attackBefore = derivedPlayerStats(leveled.player).attackPower;
    await orch.dispatch({ type: 'ALLOCATE_STAT_POINT', statId: 'str' });
    const attackAfter = derivedPlayerStats(orch.getState().player).attackPower;
    if (attackAfter === attackBefore + 2) {
      pass('I-stat-after-combat', `${attackBefore} → ${attackAfter}`);
    } else {
      fail('I-stat-after-combat', `${attackBefore} → ${attackAfter}`);
    }
  } else {
    fail('I-stat-after-combat', `pts ${leveled.player.unspentStatPoints} lv ${leveled.player.level}`);
  }

  await hopTo(orch, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  await orch.dispatch({ type: 'START_DIALOGUE', npcId: 'guildmaster_doran' });
  await hopTo(orch, LOCATION_ID.LUEN_GENERAL_STORE);
  const goldBeforeShop = orch.getState().player.gold;
  await orch.dispatch({ type: 'BUY_ITEM', itemId: ITEM_ID.HEALING_POTION });
  if (orch.getState().player.gold < goldBeforeShop) {
    pass('J-shop', `gold ${goldBeforeShop} → ${orch.getState().player.gold}`);
  } else {
    fail('J-shop', `gold ${orch.getState().player.gold}`);
  }

  const blob = playerFacingBlob(orch, (await generateStoryChoices(orch.getState())).choices.map((choice) => choice.text));
  if (!productionTextHasInternalId(blob) && !/-?\d{2,}/.test(orch.getState().relationships.seria ? toStoryScreenView(orch.getState()).relations.map((item) => item.relation).join(' ') : '')) {
    pass('K-no-internal-ids', 'clean');
  } else {
    fail('K-no-internal-ids', blob.slice(0, 300));
  }

  const relationLabels = toStoryScreenView(orch.getState()).relations.map((item) => item.relation);
  if (relationLabels.every((label) => !/^[\+\-]?\d+$/.test(label))) {
    pass('K-relation-words', relationLabels.join(','));
  } else {
    fail('K-relation-words', relationLabels.join(','));
  }

  const questTitles = [QUEST_ID.FOREST_GOBLIN_SCOUR, QUEST_ID.MARTA_LOST_PARCEL, QUEST_ID.RUINS_MYSTERY]
    .map((id) => getQuestDefinition(id)?.title ?? id)
    .join('|');
  if (!productionTextHasInternalId(questTitles)) {
    pass('K-quest-titles', questTitles);
  } else {
    fail('K-quest-titles', questTitles);
  }

  await hopTo(orch, LOCATION_ID.BLUE_MOON_INN);
  const goldBeforeRest = orch.getState().player.gold;
  await orch.dispatch({ type: 'REST' });
  const rested = orch.getState();
  if (rested.player.gold === goldBeforeRest - INN_REST_COST && Math.floor(((rested.world.totalMinutes ?? 0) % 1440) / 60) === 8) {
    pass('L-paid-rest', `day ${rested.world.day} gold ${rested.player.gold}`);
  } else {
    fail('L-paid-rest', `day ${rested.world.day} gold ${rested.player.gold} min ${rested.world.totalMinutes}`);
  }

  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(orch.getState(), undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const loadOrch = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storage) });
  await loadOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  if (
    loadOrch.getState().player.allocatedStats.str === orch.getState().player.allocatedStats.str &&
    loadOrch.getState().world.day === orch.getState().world.day
  ) {
    pass('M-save-mid-chapter', `str ${loadOrch.getState().player.allocatedStats.str}`);
  } else {
    fail('M-save-mid-chapter', JSON.stringify(loadOrch.getState().player.allocatedStats));
  }

  const full = await playOrganicChapter1();
  const finished = full.getState();
  const finishChoices = await generateStoryChoices(finished);
  const finishBlob = playerFacingBlob(full, finishChoices.choices.map((choice) => choice.text));
  if (
    isChapterCompleted(finished, CHAPTER_ID.CHAPTER_1_LUEN_RUINS) &&
    finished.player.classId !== PLAYER_CLASS_ID.ADVENTURER &&
    worldFlag(finished, WORLD_FLAG.FIRST_ADVANCEMENT_DONE) &&
    !productionTextHasInternalId(finishBlob)
  ) {
    pass('N-full-chapter', `${finished.player.classId} lv ${finished.player.level}`);
  } else {
    fail(
      'N-full-chapter',
      `class ${finished.player.classId} chapter ${isChapterCompleted(finished, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)} adv ${worldFlag(finished, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)}`
    );
  }

  const allocatedKept = finished.player.allocatedStats;
  if (allocatedKept && typeof allocatedKept.str === 'number') {
    pass('O-advancement-stats-kept', JSON.stringify(allocatedKept));
  } else {
    fail('O-advancement-stats-kept', JSON.stringify(allocatedKept));
  }

  if (canChooseFirstAdvancement(finished) === false && finished.player.classId === PLAYER_CLASS_ID.WARRIOR) {
    pass('P-advancement-closed', finished.player.classId);
  } else {
    fail('P-advancement-closed', `${finished.player.classId} can ${canChooseFirstAdvancement(finished)}`);
  }

  const later = createGameOrchestrator(createInitialGameState());
  await later.dispatch({ type: 'NEW_GAME', name: '후반' });
  await later.dispatch({ type: 'CONTINUE_STORY' });
  await hopTo(later, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_exp_none' });
  await later.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await hopTo(later, LOCATION_ID.FOREST_ROAD);
  await later.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS });
  await later.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_FOREST_SCOUTS, ['scout_goblin_001', 'scout_goblin_002']),
  });
  await hopTo(later, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  await later.dispatch({ type: 'START_DIALOGUE', npcId: 'guildmaster_doran' });
  await later.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await hopTo(later, LOCATION_ID.ANCIENT_RUINS);
  await later.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE });
  await later.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_RUINS_GATE, ['gate_goblin_001', 'gate_archer_001', 'gate_brute_001']),
  });
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_ALTAR });
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_LOOK_AROUND });
  await later.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 });
  if (later.getState().mode === 'COMBAT') {
    await later.dispatch({
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
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: 'investigate_guardian_core' });
  await hopTo(later, LOCATION_ID.LUEN_VILLAGE);
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REPORT_RUINS });
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: 'report_all' });
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: 'seria_follow_done' });
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: 'leon_agree_seria' });
  if (getMainObjectiveText(later.getState()).includes('여관')) {
    pass('Q-epilogue-objective', getMainObjectiveText(later.getState()));
  } else {
    fail('Q-epilogue-objective', getMainObjectiveText(later.getState()));
  }
  await hopTo(later, LOCATION_ID.BLUE_MOON_INN);
  await later.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REST_INN });
  if (worldFlag(later.getState(), WORLD_FLAG.EPILOGUE_REST_DONE) && worldFlag(later.getState(), WORLD_FLAG.STORY_FREE_REST_USED)) {
    pass('R-story-free-rest', `gold ${later.getState().player.gold}`);
  } else {
    fail(
      'R-story-free-rest',
      `done ${worldFlag(later.getState(), WORLD_FLAG.EPILOGUE_REST_DONE)} free ${worldFlag(later.getState(), WORLD_FLAG.STORY_FREE_REST_USED)} gold ${later.getState().player.gold}`
    );
  }

  return lines;
}
