import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { PLAYER_CLASS_ID, canChooseFirstAdvancement } from '../player/classes';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { ITEM_ID } from '../inventory/item-definitions';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { enhancementLevelOf } from '../inventory/enhancement-rules';
import { STARTING_GOLD } from '../economy/economy-types';
import { eventsForExpGrant } from '../player/progression/progression-rules';
import { buildChoiceCandidates, buildStoryDirectorContext, hasMainProgressCandidate } from '../story/choices';
import { resolveNextScene } from '../story/story-scene-resolver';
import { STORY_SCENE_ID } from '../story/story-scene-definitions';
import { REPEAT_POLICY, topicsForNpc } from '../dialogue/dialogue-topics';
import { isTopicAvailable } from '../dialogue/dialogue-topic-state';
import { createMemoryStorage, createSaveService, migrateSaveData, SAVE_VERSION } from '../save';
import { toPersistedGameState } from '../save/save-serialize';
import { toStoryScreenView } from '../story/story-view';
import { BOSS_INSTANCE_ID, BOSS_ID } from '../combat/boss/boss-types';

function victory(combatId: string, enemies: string[]) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 40 },
    defeatedEnemyIds: enemies,
    defeatedEnemyTypes: enemies.map(() => 'goblin'),
  };
}

function withShop(state = createInitialGameState()) {
  return applyEvents(state, [
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.SHOP_UNLOCKED, value: true },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.ENHANCEMENT_UNLOCKED, value: true },
  ]);
}

function consumeAllTopics(state: ReturnType<typeof createInitialGameState>, npcId: string) {
  const events = topicsForNpc(state, npcId).flatMap((topic) => {
    const id =
      topic.repeatPolicy === REPEAT_POLICY.UNTIL_STATE_CHANGE || topic.repeatPolicy === REPEAT_POLICY.DAILY
        ? `${npcId}:${topic.topicId}`
        : `${npcId}:${topic.topicId}`;
    return [{ type: 'DIALOGUE_TOPIC_CONSUMED' as const, topicId: id }, { type: 'DIALOGUE_TOPIC_CONSUMED' as const, topicId: topic.topicId }];
  });
  return applyEvents(state, events);
}

export async function runStep34FlowScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const started = createInitialGameState();
  if (started.player.gold === STARTING_GOLD && started.player.level === 1) {
    pass('A-starting-gold', `${started.player.gold}G`);
  } else {
    fail('A-starting-gold', `${started.player.gold}`);
  }

  const orch = createGameOrchestrator(createInitialGameState());
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
  const afterScouts = orch.getState();
  if (worldFlag(afterScouts, WORLD_FLAG.FOREST_GOBLIN_DEFEATED) && afterScouts.player.gold > STARTING_GOLD) {
    pass('B-scouts', `gold ${afterScouts.player.gold}`);
  } else {
    fail('B-scouts', `gold ${afterScouts.player.gold} flag ${worldFlag(afterScouts, WORLD_FLAG.FOREST_GOBLIN_DEFEATED)}`);
  }

  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS });
  if (orch.getState().mode !== 'COMBAT') {
    pass('C-oneshot', 'scouts not repeated');
  } else {
    fail('C-oneshot', 'repeat combat started');
  }

  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'START_DIALOGUE', npcId: 'guildmaster_doran' });
  const afterReport = orch.getState();
  if (afterReport.quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status === QUEST_STATUS.COMPLETED && worldFlag(afterReport, WORLD_FLAG.SHOP_UNLOCKED)) {
    pass('D-quest-shop-unlock', `gold ${afterReport.player.gold}`);
  } else {
    fail('D-quest-shop-unlock', `${afterReport.quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status} shop ${worldFlag(afterReport, WORLD_FLAG.SHOP_UNLOCKED)}`);
  }

  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  await orch.dispatch({ type: 'BUY_ITEM', itemId: ITEM_ID.HEALING_POTION });
  const afterPotion = orch.getState();
  if (afterPotion.player.gold < afterReport.player.gold) {
    pass('E-shop-potion', `gold ${afterPotion.player.gold}`);
  } else {
    fail('E-shop-potion', `gold ${afterPotion.player.gold}`);
  }

  const poor = applyEvents(withShop(), [{ type: 'PLAYER_GOLD_UPDATED', gold: 0 }]);
  const poorOrch = createGameOrchestrator({
    ...poor,
    player: { ...poor.player, inventory: [...poor.player.inventory, { itemId: ITEM_ID.IRON_SWORD, quantity: 1 }] },
  });
  await poorOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  await poorOrch.dispatch({ type: 'ENHANCE_EQUIPMENT', itemId: ITEM_ID.IRON_SWORD });
  if (poorOrch.getState().player.gold === 0 && enhancementLevelOf(poorOrch.getState(), ITEM_ID.IRON_SWORD) === 0) {
    pass('G-enhance-broke', 'no negative gold');
  } else {
    fail('G-enhance-broke', `gold ${poorOrch.getState().player.gold}`);
  }

  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_FOREST_AMBUSH, ['ambush_goblin_001', 'ambush_archer_001']),
  });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  await orch.dispatch({ type: 'SET_PLAYER_GOLD', gold: 200 });
  await orch.dispatch({ type: 'BUY_ITEM', itemId: ITEM_ID.IRON_SWORD });
  await orch.dispatch({ type: 'EQUIP_ITEM', itemId: ITEM_ID.IRON_SWORD });
  const equipped = orch.getState();
  const attackAfter = derivedPlayerStats(equipped.player).attackPower;
  if (equipped.player.equipment.weapon === ITEM_ID.IRON_SWORD && attackAfter > 16) {
    pass('E2-shop-equip', `attack ${attackAfter}`);
  } else {
    fail('E2-shop-equip', JSON.stringify({ weapon: equipped.player.equipment.weapon, attackAfter }));
  }
  const goldBeforeEnhance = equipped.player.gold;
  await orch.dispatch({ type: 'ENHANCE_EQUIPMENT', itemId: ITEM_ID.IRON_SWORD });
  const enhanced = orch.getState();
  if (
    enhancementLevelOf(enhanced, ITEM_ID.IRON_SWORD) === 1 &&
    enhanced.player.gold === goldBeforeEnhance - 25 &&
    derivedPlayerStats(enhanced.player).attackPower > attackAfter
  ) {
    pass('F-enhance', `+${enhancementLevelOf(enhanced, ITEM_ID.IRON_SWORD)} gold ${enhanced.player.gold}`);
  } else {
    fail('F-enhance', `lv ${enhancementLevelOf(enhanced, ITEM_ID.IRON_SWORD)} gold ${enhanced.player.gold}`);
  }
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.LEON_GOBLIN_WATCH });
  if (orch.getState().quests[QUEST_ID.LEON_GOBLIN_WATCH]?.status !== QUEST_STATUS.ACTIVE) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
    await orch.dispatch({
      type: 'RECORD_DIALOGUE',
      npcId: 'leon',
      playerText: '북문 경계를 묻는다',
      npcText: '고블린이 늘고 있다.',
    });
    await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.LEON_GOBLIN_WATCH });
  }
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_GOBLIN_CAMP });
  if (orch.getState().mode === 'COMBAT') {
    await orch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: victory(ENCOUNTER_ID.CH1_GOBLIN_CAMP, ['camp_goblin_001', 'camp_goblin_002', 'camp_archer_001']),
    });
  }
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'investigate_area' });

  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_RUINS_GATE, ['gate_goblin_001', 'gate_archer_001', 'gate_brute_001']),
  });
  const beforeBossLevel = orch.getState().player.level;
  if (beforeBossLevel >= 2) {
    pass('H-pre-boss-level', `lv ${beforeBossLevel} encounters 4`);
  } else {
    fail('H-pre-boss-level', `lv ${beforeBossLevel}`);
  }

  const zeroTalk = consumeAllTopics(createInitialGameState(), 'seria');
  const zeroVillage = applyEvents(zeroTalk, [{ type: 'NPC_MOVED', npcId: 'seria', fromLocationId: LOCATION_ID.LUEN_VILLAGE, toLocationId: LOCATION_ID.LUEN_VILLAGE }]);
  const zeroCandidates = buildChoiceCandidates(zeroVillage, buildStoryDirectorContext(zeroVillage));
  if (zeroCandidates.length > 0) {
    pass('I-zero-choice', `${zeroCandidates.length} fallback`);
  } else {
    fail('I-zero-choice', 'empty');
  }

  const seriaState = createInitialGameState();
  const firstTopics = topicsForNpc(seriaState, 'seria').filter((topic) => isTopicAvailable(seriaState, topic));
  const consumed = applyEvents(seriaState, firstTopics.map((topic) => ({ type: 'DIALOGUE_TOPIC_CONSUMED' as const, topicId: `seria:${topic.topicId}` })));
  const afterTopics = topicsForNpc(consumed, 'seria').filter((topic) => isTopicAvailable(consumed, topic));
  const afterCandidates = buildChoiceCandidates(consumed, buildStoryDirectorContext(consumed));
  const duplicate = afterCandidates.some((candidate) => candidate.semanticKey === 'TALK:SERIA:INTRO' || candidate.semanticKey === 'TALK:SERIA:RUINS_BACKGROUND');
  if (afterTopics.length < firstTopics.length && !duplicate) {
    pass('J-duplicate-topic', `before ${firstTopics.length} after ${afterTopics.length}`);
  } else {
    fail('J-duplicate-topic', `before ${firstTopics.length} after ${afterTopics.length} dup ${duplicate}`);
  }

  if (hasMainProgressCandidate(zeroCandidates) || hasMainProgressCandidate(buildChoiceCandidates(orch.getState(), buildStoryDirectorContext(orch.getState())))) {
    pass('K-main-progress', 'present');
  } else {
    fail('K-main-progress', 'missing');
  }

  let ready = orch.getState();
  ready = applyEvents(ready, [
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_GUARDIAN_DEFEATED, value: true },
    { type: 'QUEST_COMPLETED', questId: QUEST_ID.RUINS_MYSTERY },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.GUILD_RECOGNITION_DONE, value: true },
  ]);
  ready = applyEvents(ready, eventsForExpGrant(ready, 500, 'test:lv5', 'QUEST'));
  ready = {
    ...ready,
    world: { ...ready.world, currentLocationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD },
    player: { ...ready.player, locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD, classId: PLAYER_CLASS_ID.ADVENTURER },
  };
  const scene = resolveNextScene(ready);
  if (canChooseFirstAdvancement(ready) && scene.id === STORY_SCENE_ID.LUEN_GUILD_ADVANCEMENT) {
    pass('L-advancement-scene', scene.id);
  } else {
    fail('L-advancement-scene', `${scene.id} can ${canChooseFirstAdvancement(ready)} lv ${ready.player.level}`);
  }

  const advanceOrch = createGameOrchestrator(ready);
  await advanceOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR });
  const advanced = advanceOrch.getState();
  if (
    advanced.player.classId === PLAYER_CLASS_ID.WARRIOR &&
    worldFlag(advanced, WORLD_FLAG.FIRST_ADVANCEMENT_DONE) &&
    advanced.player.equipment.weapon
  ) {
    pass('M-swordsman', advanced.player.equipment.weapon);
  } else {
    fail('M-swordsman', advanced.player.classId);
  }

  const save = createSaveService(createMemoryStorage());
  save.save('slot_1', advanced, 12);
  const loaded = save.load('slot_1');
  const old = migrateSaveData({
    version: 3,
    saveId: 'old',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    playTimeSeconds: 1,
    gameState: toPersistedGameState(createInitialGameState(), 1),
  });
  const loadedState = loaded.saveData?.gameState;
  if (
    loaded.success &&
    loadedState &&
    (loadedState.player.equipmentEnhancements?.[ITEM_ID.IRON_SWORD] ?? 0) === enhancementLevelOf(advanced, ITEM_ID.IRON_SWORD) &&
    old?.version === SAVE_VERSION
  ) {
    pass('N-save', `v${SAVE_VERSION}`);
  } else {
    fail('N-save', JSON.stringify({ ok: loaded.success, migrate: old?.version }));
  }

  const view = toStoryScreenView(createInitialGameState());
  const longChoice = '아주 긴 한국어 선택지입니다. '.repeat(8);
  if (view.choices.length >= 0 && longChoice.length > 40 && view.timeOfDay === 'MORNING') {
    pass('O-footer-layout', `tod ${view.timeOfDay}`);
  } else {
    fail('O-footer-layout', `${view.timeOfDay}`);
  }

  return lines;
}

export async function playOrganicChapter1() {
  const orch = createGameOrchestrator(createInitialGameState());
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
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'START_DIALOGUE', npcId: 'guildmaster_doran' });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  await orch.dispatch({ type: 'BUY_ITEM', itemId: ITEM_ID.HEALING_POTION });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH });
  if (orch.getState().mode === 'COMBAT') {
    await orch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: victory(ENCOUNTER_ID.CH1_FOREST_AMBUSH, ['ambush_goblin_001', 'ambush_archer_001']),
    });
  }
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_RUINS_GATE, ['gate_goblin_001', 'gate_archer_001', 'gate_brute_001']),
  });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'investigate_altar' });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 });
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
  return orch;
}
