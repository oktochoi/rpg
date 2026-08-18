import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { PLAYER_CLASS_ID } from '../player/classes';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { CHAPTER_ID, isChapterCompleted } from '../story/chapters';
import { CHOICE_INVESTIGATE_ALTAR, CHOICE_LOOK_AROUND, CHOICE_OPEN_SHOP, CHOICE_REST_INN, CHOICE_TALK_SERIA } from '../world/locations/location-story-choices';
import { CHOICE_FIGHT_GUARDIAN } from '../story/story-scene-definitions';
import { CHOICE_REPORT_RUINS } from '../quests/quest-story-choices';
import { ITEM_ID } from '../inventory/item-definitions';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { STARTING_GOLD, INN_REST_COST } from '../economy/economy-types';
import { createMemoryStorage, createSaveService, migrateSaveData, SAVE_VERSION } from '../save';
import { toStoryScreenView } from '../story/story-view';
import { resolveStoryBackground } from '../visual/story-background';
import { resolveNpcPortrait } from '../visual/npc-portrait';
import { BOSS_ID, BOSS_INSTANCE_ID } from '../combat/boss/boss-types';
import { eventsForProgression, eventsForExpGrant } from '../player/progression/progression-rules';
import { buildCombatConfig } from '../combat/build-combat-config';

function withShopUnlocked(state = createInitialGameState()) {
  return applyEvents(state, [
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.SHOP_UNLOCKED, value: true },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.ENHANCEMENT_UNLOCKED, value: true },
  ]);
}

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
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_FOREST_SCOUTS, ['scout_goblin_001', 'scout_goblin_002']),
  });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'START_DIALOGUE', npcId: 'guildmaster_doran' });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_OPEN_SHOP });
  await orch.dispatch({ type: 'CLOSE_MENU' });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.FOREST_GOBLIN_01 });
  await orch.dispatch({ type: 'RESOLVE_COMBAT', result: victory(ENCOUNTER_ID.FOREST_GOBLIN_01, ['forest_goblin_001']) });
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
        player: { remainingHp: 55, remainingMp: 30 },
        defeatedEnemyIds: [BOSS_INSTANCE_ID.RUINS_GUARDIAN],
        defeatedEnemyTypes: [BOSS_ID.RUINS_GUARDIAN],
      },
    });
  }
  // Post-boss investigation → escape
  const postBoss = orch.getState();
  console.log('[DEBUG] post-boss scene:', postBoss.story.currentSceneId, 'loc:', postBoss.world.currentLocationId, 'defeated:', postBoss.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED]);
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'investigate_guardian_core' });
  const postInv = orch.getState();
  console.log('[DEBUG] post-investigate scene:', postInv.story.currentSceneId, 'flags:', Object.entries(postInv.world.flags).filter(([,v])=>v).map(([k])=>k).join(','));
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REPORT_RUINS });
  const { getAvailableScenes } = await import('../story/story-scene-resolver');
  const st = orch.getState();
  const av = getAvailableScenes(st);
  console.log('[DEBUG] after-report scene:', st.story.currentSceneId, 'quest:', st.quests[QUEST_ID.RUINS_MYSTERY]?.status, 'seria_flag:', st.world.flags[WORLD_FLAG.SERIA_FINAL_REPORT], 'returned:', st.world.flags[WORLD_FLAG.RETURNED_TO_LUEN], 'visited:', st.story.visitedSceneIds?.includes?.('seria_final_report'));
  console.log('[DEBUG] available:', av.map(s => `${s.id}(${s.priority})`).join(', '));
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'report_all' });
  // LEON_CONFRONTATION should auto-fire
  console.log('[DEBUG] after-report-all scene:', orch.getState().story.currentSceneId, 'leon_done:', orch.getState().world.flags[WORLD_FLAG.LEON_CONFRONTATION_DONE]);
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'leon_tell_all' });
  console.log('[DEBUG] after-leon scene:', orch.getState().story.currentSceneId);
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN });
  console.log('[DEBUG] at-inn scene:', orch.getState().story.currentSceneId, 'leon_done:', orch.getState().world.flags[WORLD_FLAG.LEON_CONFRONTATION_DONE]);
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REST_INN });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  console.log('[DEBUG] at-guild scene:', orch.getState().story.currentSceneId, 'guild_done:', orch.getState().world.flags[WORLD_FLAG.GUILD_RECOGNITION_DONE]);
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'choose_path_warrior' });
  console.log('[DEBUG] after-class:', orch.getState().player.classId, 'advancement:', orch.getState().world.flags[WORLD_FLAG.FIRST_ADVANCEMENT_DONE]);
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.NORTHERN_GATE });
  console.log('[DEBUG] at-gate scene:', orch.getState().story.currentSceneId, 'hook:', orch.getState().world.flags[WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN]);
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  return orch;
}

export async function runStep32FlowScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const started = createInitialGameState();
  if (
    started.player.level === 1 &&
    started.player.classId === PLAYER_CLASS_ID.ADVENTURER &&
    started.player.gold === STARTING_GOLD &&
    started.player.equipment.weapon === ITEM_ID.WORN_SWORD &&
    started.player.equipment.armor === ITEM_ID.TRAVELER_CLOTHES &&
    started.player.inventory.some((item) => item.itemId === ITEM_ID.HEALING_POTION && item.quantity === 2)
  ) {
    pass('A-new-game', `gold ${started.player.gold}`);
  } else {
    fail('A-new-game', JSON.stringify({ gold: started.player.gold, inv: started.player.inventory, eq: started.player.equipment }));
  }

  const orchB = createGameOrchestrator(createInitialGameState());
  await orchB.dispatch({ type: 'OPEN_MENU', menu: 'inventory' });
  const beforeUse = orchB.getState().player.inventory.find((item) => item.itemId === ITEM_ID.HEALING_POTION)?.quantity ?? 0;
  await orchB.dispatch({ type: 'USE_ITEM', itemId: ITEM_ID.HEALING_POTION });
  const afterUseQty = orchB.getState().player.inventory.find((item) => item.itemId === ITEM_ID.HEALING_POTION)?.quantity ?? 0;
  if (orchB.getState().activeMenu === 'inventory' && afterUseQty === beforeUse - 1) {
    pass('B-inventory', `potion ${afterUseQty}`);
  } else {
    fail('B-inventory', `menu ${orchB.getState().activeMenu} qty ${afterUseQty}`);
  }

  const orchC = createGameOrchestrator(withShopUnlocked());
  await orchC.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  const goldBeforeBuy = orchC.getState().player.gold;
  await orchC.dispatch({ type: 'BUY_ITEM', itemId: ITEM_ID.HEALING_POTION });
  const afterBuy = orchC.getState();
  const potions = afterBuy.player.inventory.find((item) => item.itemId === ITEM_ID.HEALING_POTION)?.quantity ?? 0;
  if (afterBuy.player.gold === goldBeforeBuy - 20 && potions === 3) {
    pass('C-shop-buy', `gold ${afterBuy.player.gold} potions ${potions}`);
  } else {
    fail('C-shop-buy', `gold ${afterBuy.player.gold} potions ${potions}`);
  }

  const noGold = applyEvents(withShopUnlocked(), [{ type: 'PLAYER_GOLD_UPDATED', gold: 0 }]);
  const orchD = createGameOrchestrator(noGold);
  await orchD.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  await orchD.dispatch({ type: 'BUY_ITEM', itemId: ITEM_ID.IRON_SWORD });
  if (orchD.getState().player.gold === 0 && !orchD.getState().player.inventory.some((item) => item.itemId === ITEM_ID.IRON_SWORD)) {
    pass('D-no-gold', 'rejected');
  } else {
    fail('D-no-gold', `gold ${orchD.getState().player.gold}`);
  }

  const orchE = createGameOrchestrator(withShopUnlocked());
  await orchE.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  const goldBeforeSell = orchE.getState().player.gold;
  await orchE.dispatch({ type: 'SELL_ITEM', itemId: ITEM_ID.HEALING_POTION, quantity: 1 });
  if (orchE.getState().player.gold === goldBeforeSell + 8) {
    pass('E-sell', `gold ${orchE.getState().player.gold}`);
  } else {
    fail('E-sell', `gold ${orchE.getState().player.gold}`);
  }

  const orchF = createGameOrchestrator(withShopUnlocked());
  await orchF.dispatch({ type: 'SET_PLAYER_GOLD', gold: 200 });
  await orchF.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_GENERAL_STORE });
  await orchF.dispatch({ type: 'BUY_ITEM', itemId: ITEM_ID.IRON_SWORD });
  const beforeAttack = derivedPlayerStats(orchF.getState().player).attackPower;
  await orchF.dispatch({ type: 'EQUIP_ITEM', itemId: ITEM_ID.IRON_SWORD });
  const afterEquip = orchF.getState();
  const afterAttack = derivedPlayerStats(afterEquip.player).attackPower;
  const config = buildCombatConfig(afterEquip, ENCOUNTER_ID.RUINS_EASY_01);
  if (afterEquip.player.equipment.weapon === ITEM_ID.IRON_SWORD && afterAttack > beforeAttack && (config?.player.attackBonus ?? 0) >= 6) {
    pass('F-equip', `attack ${beforeAttack}→${afterAttack} bonus ${config?.player.attackBonus}`);
  } else {
    fail('F-equip', JSON.stringify({ weapon: afterEquip.player.equipment.weapon, beforeAttack, afterAttack, bonus: config?.player.attackBonus }));
  }

  await orchF.dispatch({ type: 'UNEQUIP_ITEM', slot: 'WEAPON' });
  const afterUnequip = orchF.getState();
  if (
    afterUnequip.player.equipment.weapon === null &&
    afterUnequip.player.inventory.some((item) => item.itemId === ITEM_ID.IRON_SWORD) &&
    derivedPlayerStats(afterUnequip.player).attackPower < afterAttack
  ) {
    pass('G-unequip', 'weapon returned');
  } else {
    fail('G-unequip', JSON.stringify(afterUnequip.player.equipment));
  }

  const mageState = applyEvents(createInitialGameState(), [{ type: 'PLAYER_CLASS_UPDATED', classId: PLAYER_CLASS_ID.MAGE }]);
  const orchH = createGameOrchestrator({
    ...mageState,
    player: {
      ...mageState.player,
      inventory: [...mageState.player.inventory, { itemId: ITEM_ID.IRON_SWORD, quantity: 1 }],
    },
  });
  await orchH.dispatch({ type: 'EQUIP_ITEM', itemId: ITEM_ID.IRON_SWORD });
  if (orchH.getState().player.equipment.weapon !== ITEM_ID.IRON_SWORD) {
    pass('H-class-restriction', orchH.getState().player.equipment.weapon ?? 'none');
  } else {
    fail('H-class-restriction', 'mage equipped iron sword');
  }

  const hurt = applyEvents(createInitialGameState(), [{ type: 'PLAYER_COMBAT_HP_UPDATED', currentHp: 40 }]);
  const orchI = createGameOrchestrator(hurt);
  await orchI.dispatch({ type: 'USE_ITEM', itemId: ITEM_ID.HEALING_POTION });
  if (orchI.getState().player.currentHp === 70) {
    pass('I-potion', `hp ${orchI.getState().player.currentHp}`);
  } else {
    fail('I-potion', `hp ${orchI.getState().player.currentHp}`);
  }

  const questOrch = createGameOrchestrator(createInitialGameState());
  await questOrch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await questOrch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  const goldBeforeQuest = questOrch.getState().player.gold;
  const incoming = [{ type: 'QUEST_COMPLETED' as const, questId: QUEST_ID.RUINS_MYSTERY }];
  const rewarded = applyEvents(questOrch.getState(), [...incoming, ...eventsForProgression(questOrch.getState(), incoming)]);
  if (rewarded.player.gold === goldBeforeQuest + 70) {
    pass('J-quest-reward', `gold ${rewarded.player.gold}`);
  } else {
    fail('J-quest-reward', `gold ${rewarded.player.gold} from ${goldBeforeQuest}`);
  }

  const combatOrch = createGameOrchestrator(createInitialGameState());
  await combatOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_EASY_01 });
  const goldBeforeCombat = combatOrch.getState().player.gold;
  await combatOrch.dispatch({ type: 'RESOLVE_COMBAT', result: victory(ENCOUNTER_ID.RUINS_EASY_01, ['goblin_01']) });
  const afterCombat = combatOrch.getState();
  if (afterCombat.player.gold === goldBeforeCombat + 12 && afterCombat.player.inventory.some((item) => item.itemId === ITEM_ID.GOBLIN_EAR)) {
    pass('K-combat-reward', `gold ${afterCombat.player.gold}`);
  } else {
    fail('K-combat-reward', `gold ${afterCombat.player.gold}`);
  }

  const goldAfterFirst = afterCombat.player.gold;
  await combatOrch.dispatch({ type: 'RESOLVE_COMBAT', result: victory(ENCOUNTER_ID.RUINS_EASY_01, ['goblin_01']) });
  if (combatOrch.getState().player.gold === goldAfterFirst) {
    pass('L-duplicate-reward', 'no second payout');
  } else {
    fail('L-duplicate-reward', `gold ${combatOrch.getState().player.gold}`);
  }

  const restOrch = createGameOrchestrator(createInitialGameState());
  await restOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.BLUE_MOON_INN });
  const goldBeforeRest = restOrch.getState().player.gold;
  await restOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_REST_INN });
  const rested = restOrch.getState();
  if (rested.player.gold === goldBeforeRest - INN_REST_COST && rested.world.day === 2 && rested.player.currentHp === derivedPlayerStats(rested.player).maxHp) {
    pass('M-inn', `gold ${rested.player.gold} day ${rested.world.day}`);
  } else {
    fail('M-inn', `gold ${rested.player.gold} day ${rested.world.day} hp ${rested.player.currentHp}`);
  }

  if (
    resolveStoryBackground(LOCATION_ID.LUEN_VILLAGE).path.includes('01_luen_village') &&
    resolveStoryBackground(LOCATION_ID.BLUE_MOON_INN).path.includes('02_blue_moon') &&
    resolveStoryBackground(LOCATION_ID.LUEN_ADVENTURERS_GUILD).path.includes('03_adventurers') &&
    resolveStoryBackground(LOCATION_ID.FOREST_ROAD).path.includes('04_forest') &&
    resolveStoryBackground(LOCATION_ID.ANCIENT_RUINS).path.includes('05_ancient')
  ) {
    pass('N-backgrounds', 'story pack mapped');
  } else {
    fail('N-backgrounds', resolveStoryBackground(LOCATION_ID.LUEN_VILLAGE).path);
  }

  if (
    resolveNpcPortrait('seria').path.includes('06_seria') &&
    resolveNpcPortrait('leon').path.includes('07_leon') &&
    resolveNpcPortrait('innkeeper').path.includes('08_marta')
  ) {
    pass('O-portraits', 'npc pack mapped');
  } else {
    fail('O-portraits', resolveNpcPortrait('seria').path);
  }

  const full = await playChapter1();
  const done = full.getState();
  const chapterDone = isChapterCompleted(done, CHAPTER_ID.CHAPTER_1_LUEN_RUINS);
  if (chapterDone && done.player.level >= 4 && done.player.level <= 7 && done.player.gold >= 150 && done.player.gold <= 400) {
    pass('P-full-chapter', `lv ${done.player.level} gold ${done.player.gold}`);
  } else {
    fail('P-full-chapter', JSON.stringify({ chapterDone, lv: done.player.level, gold: done.player.gold, quest: done.quests[QUEST_ID.RUINS_MYSTERY]?.status }));
  }

  const preAdvancement: typeof done = {
    ...done,
    player: { ...done.player, classId: PLAYER_CLASS_ID.ADVENTURER },
    world: { ...done.world, flags: { ...done.world.flags, [WORLD_FLAG.FIRST_ADVANCEMENT_DONE]: false } },
  };
  const ready = applyEvents(preAdvancement, eventsForExpGrant(preAdvancement, 500, 'test:lv5', 'QUEST'));
  const swordsman = createGameOrchestrator(ready);
  if ((swordsman.getState().player.level ?? 1) < 5) {
    fail('Q-swordsman', `lv ${swordsman.getState().player.level}`);
  } else {
    await swordsman.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
    await swordsman.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR });
    const warrior = swordsman.getState();
    if (warrior.player.classId === PLAYER_CLASS_ID.WARRIOR && warrior.player.equipment.weapon === ITEM_ID.IRON_SWORD) {
      pass('Q-swordsman', warrior.player.equipment.weapon);
    } else {
      fail('Q-swordsman', `${warrior.player.classId} ${warrior.player.equipment.weapon}`);
    }
  }

  const mageOrch = createGameOrchestrator(ready);
  await mageOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await mageOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.MAGE });
  if (mageOrch.getState().player.classId === PLAYER_CLASS_ID.MAGE && mageOrch.getState().player.equipment.weapon === ITEM_ID.APPRENTICE_STAFF) {
    pass('R-mage', mageOrch.getState().player.equipment.weapon ?? '');
  } else {
    fail('R-mage', `${mageOrch.getState().player.classId} ${mageOrch.getState().player.equipment.weapon}`);
  }

  const rogueOrch = createGameOrchestrator(ready);
  await rogueOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await rogueOrch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.ROGUE });
  if (rogueOrch.getState().player.classId === PLAYER_CLASS_ID.ROGUE && rogueOrch.getState().player.equipment.weapon === ITEM_ID.STEEL_DAGGER) {
    pass('S-rogue', rogueOrch.getState().player.equipment.weapon ?? '');
  } else {
    fail('S-rogue', `${rogueOrch.getState().player.classId} ${rogueOrch.getState().player.equipment.weapon}`);
  }

  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(done, undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  await saveOrch.dispatch({ type: 'SET_PLAYER_GOLD', gold: 1 });
  await saveOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = saveOrch.getState();
  if (loaded.player.gold === done.player.gold && loaded.player.equipment.weapon === done.player.equipment.weapon && loaded.player.level === done.player.level) {
    pass('T-save-load', `gold ${loaded.player.gold}`);
  } else {
    fail('T-save-load', JSON.stringify({ gold: loaded.player.gold, weapon: loaded.player.equipment.weapon }));
  }

  const broke = applyEvents(createInitialGameState(), [{ type: 'PLAYER_GOLD_UPDATED', gold: 0 }]);
  const brokeOrch = createGameOrchestrator(broke);
  await brokeOrch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await brokeOrch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  if (brokeOrch.getState().quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.ACTIVE && brokeOrch.getState().player.gold === 0) {
    pass('U-softlock', 'main quest without gold');
  } else {
    fail('U-softlock', brokeOrch.getState().quests[QUEST_ID.RUINS_MYSTERY]?.status ?? 'none');
  }

  const view = toStoryScreenView(started);
  const migrated = migrateSaveData({
    version: 1,
    saveId: 'old',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    playTimeSeconds: 1,
    gameState: {
      meta: { playTimeSeconds: 1 },
      mode: 'STORY',
      activeCombatId: null,
      pendingFreeActionTurnId: null,
      lastActionResolution: null,
      processedRelationshipSourceIds: [],
      processedMemorySourceIds: [],
      player: { ...createInitialGameState().player, gold: undefined, equipment: undefined },
      world: createInitialGameState().world,
      npcs: createInitialGameState().npcs,
      relationships: createInitialGameState().relationships,
      quests: createInitialGameState().quests,
      knowledge: createInitialGameState().knowledge,
      npcMemories: createInitialGameState().npcMemories,
      story: createInitialGameState().story,
      history: [],
    },
  });
  if (
    view.player.gold === STARTING_GOLD &&
    chapterDone &&
    migrated?.version === SAVE_VERSION &&
    typeof migrated.gameState.player.gold === 'number' &&
    migrated.gameState.npcs.shopkeeper_elin
  ) {
    pass('V-regression', `gold UI ${view.player.gold} save v${migrated.version}`);
  } else {
    fail('V-regression', JSON.stringify({ gold: view.player.gold, chapterDone, version: migrated?.version }));
  }

  return lines;
}
