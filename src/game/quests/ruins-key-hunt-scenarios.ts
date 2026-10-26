import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { ITEM_ID } from '../inventory/item-definitions';
import { playerHasItem } from '../player/player-state';
import { canChooseFirstAdvancement, FIRST_ADVANCEMENT_LEVEL, PLAYER_CLASS_ID } from '../player/classes';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import {
  RUINS_KEY_PITY_FAILURES,
  resetRuinsKeyDropRng,
  setRuinsKeyDropRng,
  playerHasRuinsKey,
  ruinsKeyFailedAttempts,
} from '../quests/ruins-key-hunt';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { validateMoveToLocation } from '../world/locations/location-rules';
import { worldFlag } from '../world/locations/location-selectors';
import { createMemoryStorage, createSaveService } from '../save';
import { isEncounterCleared } from '../combat/encounters/encounter-progress';
import { CHOICE_FIGHT_GUARDIAN, STORY_SCENE_ID } from '../story/story-scene-definitions';
import { CHOICE_INVESTIGATE_ALTAR } from '../world/locations/location-story-choices';
import { BOSS_ID, BOSS_INSTANCE_ID } from '../combat/boss/boss-types';

function victory(combatId: string, enemies: string[]) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 40 },
    defeatedEnemyIds: enemies,
    defeatedEnemyTypes: enemies.map(() => 'goblin'),
  };
}

async function reachAfterScout(options?: { advance?: boolean }): Promise<ReturnType<typeof createGameOrchestrator>> {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'NEW_GAME', name: '키헌트' });
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
  if (options?.advance !== false && canChooseFirstAdvancement(orch.getState())) {
    await orch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR });
  }
  return orch;
}

async function reachKeyHunt(): Promise<ReturnType<typeof createGameOrchestrator>> {
  const orch = await reachAfterScout();
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  return orch;
}

export async function runRuinsKeyHuntScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  try {
    // 1. First advancement unlocks after forest scout (not guardian)
    const afterScout = await reachAfterScout({ advance: false });
    const scoutDone = afterScout.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status === QUEST_STATUS.COMPLETED;
    const canAdvance = canChooseFirstAdvancement(afterScout.getState());
    const noGuardian = !worldFlag(afterScout.getState(), WORLD_FLAG.RUINS_GUARDIAN_DEFEATED);
    if (scoutDone && canAdvance && noGuardian && (afterScout.getState().player.level ?? 1) >= FIRST_ADVANCEMENT_LEVEL) {
      pass('1-first-advancement-after-scout', `lv ${afterScout.getState().player.level}`);
    } else {
      fail(
        '1-first-advancement-after-scout',
        JSON.stringify({
          scoutDone,
          canAdvance,
          noGuardian,
          level: afterScout.getState().player.level,
          forest: afterScout.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status,
        })
      );
    }
    const withoutForest = createGameOrchestrator(createInitialGameState());
    await withoutForest.dispatch({ type: 'NEW_GAME', name: '잠금' });
    await withoutForest.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
    await withoutForest.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_adventurer' });
    const boosted = applyEvents(withoutForest.getState(), [
      { type: 'PLAYER_LEVEL_UP', fromLevel: 1, toLevel: 2, hpDelta: 5, mpDelta: 2, attackDelta: 1, statPointsGranted: 1 },
    ]);
    if (!canChooseFirstAdvancement(boosted)) {
      pass('1b-locked-without-forest', 'ok');
    } else {
      fail('1b-locked-without-forest', 'unexpected unlock');
    }

    // 2. Ruins blocked without key
    const locked = await reachKeyHunt();
    await locked.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
    const denied = validateMoveToLocation(locked.getState(), LOCATION_ID.ANCIENT_RUINS);
    if (!denied.allowed && (denied.reason?.includes('석문') || denied.reason?.includes('열쇠'))) {
      pass('2-ruins-locked-without-key', denied.reason ?? 'denied');
    } else {
      fail('2-ruins-locked-without-key', JSON.stringify(denied));
    }

    // 3. Early ambush cannot skip the deep forest and the camp, even on a perfect roll.
    setRuinsKeyDropRng(() => 0);
    const dropOrch = await reachKeyHunt();
    await dropOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
    await dropOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH });
    await dropOrch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: victory(ENCOUNTER_ID.CH1_FOREST_AMBUSH, ['ambush_goblin_001', 'ambush_archer_001']),
    });
    resetRuinsKeyDropRng();
    if (!playerHasRuinsKey(dropOrch.getState())) {
      pass('3-ambush-cannot-skip-route', 'key still missing');
    } else {
      fail('3-ambush-cannot-skip-route', JSON.stringify(dropOrch.getState().player.inventory));
    }

    // 4. Key drop only once
    const onceOrch = createGameOrchestrator(dropOrch.getState());
    setRuinsKeyDropRng(() => 0);
    await onceOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_GOBLIN_CAMP });
    if (onceOrch.getState().mode === 'COMBAT') {
      await onceOrch.dispatch({
        type: 'RESOLVE_COMBAT',
        result: victory(ENCOUNTER_ID.CH1_GOBLIN_CAMP, [
          'camp_goblin_001',
          'camp_goblin_002',
          'camp_goblin_003',
          'camp_archer_001',
        ]),
      });
    }
    resetRuinsKeyDropRng();
    const keyStacks = onceOrch.getState().player.inventory.filter((item) => item.itemId === ITEM_ID.RUINS_OLD_KEY);
    const qty = keyStacks.reduce((sum, item) => sum + item.quantity, 0);
    if (qty === 0) {
      pass('4-route-fights-do-not-drop-key', `qty ${qty}`);
    } else {
      fail('4-route-fights-do-not-drop-key', `qty ${qty}`);
    }

    // 5. Five failures unlock key holder
    setRuinsKeyDropRng(() => 0.99);
    const pityOrch = await reachKeyHunt();
    await pityOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
    for (let i = 0; i < RUINS_KEY_PITY_FAILURES; i += 1) {
      const combatId = i % 2 === 0 ? ENCOUNTER_ID.CH1_FOREST_AMBUSH : ENCOUNTER_ID.CH1_GOBLIN_CAMP;
      const enemies =
        combatId === ENCOUNTER_ID.CH1_FOREST_AMBUSH
          ? ['ambush_goblin_001', 'ambush_archer_001']
          : ['camp_goblin_001', 'camp_goblin_002', 'camp_goblin_003', 'camp_archer_001'];
      await pityOrch.dispatch({ type: 'START_COMBAT', combatId });
      if (pityOrch.getState().mode === 'COMBAT') {
        await pityOrch.dispatch({ type: 'RESOLVE_COMBAT', result: victory(combatId, enemies) });
      }
    }
    resetRuinsKeyDropRng();
    if (
      ruinsKeyFailedAttempts(pityOrch.getState()) >= RUINS_KEY_PITY_FAILURES &&
      worldFlag(pityOrch.getState(), WORLD_FLAG.RUINS_KEY_HOLDER_UNLOCKED) &&
      !playerHasRuinsKey(pityOrch.getState())
    ) {
      pass('5-pity-unlocks-key-holder', `fails ${ruinsKeyFailedAttempts(pityOrch.getState())}`);
    } else {
      fail(
        '5-pity-unlocks-key-holder',
        JSON.stringify({
          fails: ruinsKeyFailedAttempts(pityOrch.getState()),
          unlocked: worldFlag(pityOrch.getState(), WORLD_FLAG.RUINS_KEY_HOLDER_UNLOCKED),
          hasKey: playerHasRuinsKey(pityOrch.getState()),
        })
      );
    }

    setRuinsKeyDropRng(() => 0);
    await pityOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER });
    if (pityOrch.getState().mode === 'COMBAT') {
      await pityOrch.dispatch({
        type: 'RESOLVE_COMBAT',
        result: victory(ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER, [
          'key_holder_goblin_001',
          'key_holder_goblin_002',
        ]),
      });
    }
    resetRuinsKeyDropRng();
    if (playerHasRuinsKey(pityOrch.getState())) {
      pass('5b-key-holder-guarantees-key', 'acquired');
    } else {
      fail('5b-key-holder-guarantees-key', 'missing');
    }

    // 6. Repeat encounter 0 EXP
    const expOrch = await reachKeyHunt();
    await expOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
    const beforeLevel = expOrch.getState().player.level;
    const beforeExp = expOrch.getState().player.exp;
    setRuinsKeyDropRng(() => 0.99);
    await expOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH });
    await expOrch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: victory(ENCOUNTER_ID.CH1_FOREST_AMBUSH, ['ambush_goblin_001', 'ambush_archer_001']),
    });
    const afterFirst = expOrch.getState();
    const firstClearSource = `exp:combat:first:${ENCOUNTER_ID.CH1_FOREST_AMBUSH}`;
    const firstGranted = (afterFirst.processedExpSourceIds ?? []).includes(firstClearSource);
    const goldAfterFirst = afterFirst.player.gold;
    await expOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH });
    await expOrch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: victory(ENCOUNTER_ID.CH1_FOREST_AMBUSH, ['ambush_goblin_001', 'ambush_archer_001']),
    });
    resetRuinsKeyDropRng();
    const afterRepeat = expOrch.getState();
    const firstSourceCount = (afterRepeat.processedExpSourceIds ?? []).filter((id) => id === firstClearSource).length;
    if (firstGranted && firstSourceCount === 1 && isEncounterCleared(afterFirst, ENCOUNTER_ID.CH1_FOREST_AMBUSH)) {
      pass('6-repeat-exp-zero', `gold delta ${afterRepeat.player.gold - goldAfterFirst}`);
    } else {
      fail(
        '6-repeat-exp-zero',
        JSON.stringify({
          firstGranted,
          firstSourceCount,
          sources: afterRepeat.processedExpSourceIds,
          beforeExp,
        })
      );
    }

    // 7. Repeat can still key-roll
    if (ruinsKeyFailedAttempts(afterRepeat) >= 1 && !playerHasRuinsKey(afterRepeat)) {
      pass('7-repeat-still-key-rolls', `fails ${ruinsKeyFailedAttempts(afterRepeat)}`);
    } else {
      fail('7-repeat-still-key-rolls', `fails ${ruinsKeyFailedAttempts(afterRepeat)} key ${playerHasRuinsKey(afterRepeat)}`);
    }

    // 8. Save/Load preserves failed attempts
    const storage = createMemoryStorage();
    const saveA = createGameOrchestrator(afterRepeat, undefined, { saveService: createSaveService(storage) });
    await saveA.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
    const loadA = createGameOrchestrator(createInitialGameState(), undefined, {
      saveService: createSaveService(storage),
    });
    await loadA.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
    if (ruinsKeyFailedAttempts(loadA.getState()) === ruinsKeyFailedAttempts(afterRepeat)) {
      pass('8-save-load-key-attempts', String(ruinsKeyFailedAttempts(loadA.getState())));
    } else {
      fail(
        '8-save-load-key-attempts',
        `${ruinsKeyFailedAttempts(loadA.getState())} vs ${ruinsKeyFailedAttempts(afterRepeat)}`
      );
    }

    // 9. Key unlocks ruins only after ambush, deep forest, camp, and the key-holder.
    setRuinsKeyDropRng(() => 0);
    const unlockOrch = await reachKeyHunt();
    await unlockOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
    const route = [
      ENCOUNTER_ID.CH1_FOREST_AMBUSH,
      ENCOUNTER_ID.CH1_FOREST_DEEP,
      ENCOUNTER_ID.CH1_GOBLIN_CAMP,
      ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER,
    ] as const;
    for (const combatId of route) {
      if (unlockOrch.getState().mode === 'COMBAT') {
        await unlockOrch.dispatch({
          type: 'RESOLVE_COMBAT',
          result: victory(unlockOrch.getState().activeCombatId ?? combatId, ['route_enemy_001']),
        });
      }
      if (unlockOrch.getState().world.currentLocationId !== LOCATION_ID.FOREST_ROAD) {
        await unlockOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
      }
      await unlockOrch.dispatch({ type: 'START_COMBAT', combatId });
      if (unlockOrch.getState().mode === 'COMBAT') {
        await unlockOrch.dispatch({
          type: 'RESOLVE_COMBAT',
          result: victory(combatId, ['route_enemy_001']),
        });
      }
    }
    resetRuinsKeyDropRng();
    let withKey = createGameOrchestrator(
      applyEvents(unlockOrch.getState(), [{ type: 'LOCATION_DISCOVERED', locationId: LOCATION_ID.ANCIENT_RUINS }])
    );
    if (withKey.getState().world.currentLocationId !== LOCATION_ID.FOREST_ROAD) {
      await withKey.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
    }
    const allowed = validateMoveToLocation(withKey.getState(), LOCATION_ID.ANCIENT_RUINS);
    if (allowed.allowed && playerHasRuinsKey(withKey.getState())) {
      pass('9-key-unlocks-ruins', 'allowed');
    } else {
      fail('9-key-unlocks-ruins', JSON.stringify(allowed));
    }
    if (worldFlag(withKey.getState(), WORLD_FLAG.RUINS_KEY_MISSION_REWARD_DONE)) {
      pass('9b-mission-reward-once', 'flag set');
    } else {
      fail('9b-mission-reward-once', 'missing reward flag');
    }

    // 10. Guardian path still works (altar → combat, RESOLVE_COMBAT)
    let guardianOrch = withKey;
    await guardianOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
    await guardianOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE });
    await guardianOrch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: victory(ENCOUNTER_ID.CH1_RUINS_GATE, ['gate_goblin_001', 'gate_archer_001', 'gate_brute_001']),
    });
    await guardianOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_ALTAR });
    await guardianOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'inspect_seal_first' });
    if (guardianOrch.getState().mode !== 'COMBAT') {
      await guardianOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'touch_magic_stone' });
    }
    if (guardianOrch.getState().mode !== 'COMBAT') {
      await guardianOrch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_FIGHT_GUARDIAN });
    }
    if (guardianOrch.getState().mode === 'COMBAT') {
      await guardianOrch.dispatch({
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
    const guardianState = guardianOrch.getState();
    if (
      worldFlag(guardianState, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) &&
      playerHasItem(guardianState.player, ITEM_ID.GUARDIAN_CORE_FRAGMENT)
    ) {
      pass('10-guardian-path', `scene ${guardianState.story.currentSceneId}`);
    } else {
      fail(
        '10-guardian-path',
        JSON.stringify({
          defeated: worldFlag(guardianState, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED),
          fragment: playerHasItem(guardianState.player, ITEM_ID.GUARDIAN_CORE_FRAGMENT),
          mode: guardianState.mode,
          scene: guardianState.story.currentSceneId,
        })
      );
    }
    void STORY_SCENE_ID;
  } finally {
    resetRuinsKeyDropRng();
  }

  return lines;
}
