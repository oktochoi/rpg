import { createGameOrchestrator } from '../../core/orchestrator';
import { createInitialGameState } from '../../core/initial-state';
import { buildCombatConfig } from '../build-combat-config';
import { PLAYER_CLASS_ID, getDashProfile } from '../../player/classes';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../../knowledge/knowledge-selectors';
import { QUEST_ID } from '../../quests/quest-definitions';
import { createMemoryStorage, createSaveService } from '../../save';
import { canSaveGame } from '../../save/save-types';
import { LOCATION_ID, RUINS_GUARDIAN_FACT_ID, WORLD_FLAG } from '../../world/locations/location-definitions';
import { CHOICE_INVESTIGATE_ALTAR } from '../../world/locations/location-story-choices';
import { getAvailableChoices } from '../../story/story-choice-service';
import { CHOICE_FIGHT_GUARDIAN, STORY_SCENE_ID } from '../../story/story-scene-definitions';
import { applyDamageReduction, isBackAttack, backstabDamage } from '../skills/skill-combat-rules';
import { SKILLS } from '../skills/skill-definitions';
import { BASIC_ATTACKS } from '../attacks/basic-attack-definitions';
import { ENEMY_DEFINITIONS } from '../enemies/enemy-definitions';
import { ENEMY_TYPE_ID } from '../enemies/enemy-types';
import { runStep21EncounterScenarios } from '../encounters/encounter-scenarios';
import {
  ENCOUNTER_ID,
  getEncounter,
  isBossEncounter,
  isStartableCombatId,
  isVictoryByAliveCount,
} from '../encounters/encounter-definitions';
import { BOSS_DEFINITIONS, createBossRuntime, getBossDefinition, shouldTriggerPhase2 } from './boss-definitions';
import { bossSlowMultiplier, RUINS_GUARDIAN_CONFIG } from './boss-config';
import { BOSS_ID, BOSS_INSTANCE_ID, BOSS_PATTERN_ID, type BossProjectileShot } from './boss-types';
import { BossPatternController } from './BossPatternController';
import { HeavySlamPattern } from './patterns/HeavySlamPattern';
import { ProjectileBurstPattern } from './patterns/ProjectileBurstPattern';
import { ChargePattern } from './patterns/ChargePattern';
import type { BossPatternContext } from './patterns/boss-pattern-types';
import { formatBossDebug } from './boss-debug';
import { runStep24StoryScenarios } from '../../story/story-scenarios';

function createMockContext(phase: 1 | 2 = 1) {
  const shots: BossProjectileShot[] = [];
  let locked = { x: 1, y: 0 };
  let velocity = { x: 0, y: 0 };
  let state: 'WINDUP' | 'ATTACKING' | 'RECOVERY' = 'WINDUP';
  let telegraph: 'slam' | 'burst' | 'charge' | null = null;
  let hitbox: { active: boolean; kind: 'slam' | 'charge' | null } = { active: false, kind: null };
  const ctx: BossPatternContext = {
    x: 400,
    y: 300,
    playerX: 520,
    playerY: 300,
    width: 800,
    height: 600,
    size: 64,
    phase,
    sourceId: 'ruins_guardian_001',
    lockDirection(dirX, dirY) {
      locked = { x: dirX, y: dirY };
    },
    getLockedDirection() {
      return locked;
    },
    setVelocity(vx, vy) {
      velocity = { x: vx, y: vy };
    },
    setState(next) {
      state = next;
    },
    showTelegraph(kind) {
      telegraph = kind;
    },
    hideTelegraph() {
      telegraph = null;
    },
    setHitboxActive(active, kind) {
      hitbox = { active, kind };
    },
    fireProjectiles(nextShots) {
      shots.push(...nextShots);
    },
    clampToArena() {
      if (ctx.x <= 32 || ctx.x >= ctx.width - 32 || ctx.y <= 32 || ctx.y >= ctx.height - 32) {
        velocity = { x: 0, y: 0 };
        return true;
      }
      return false;
    },
  };
  return {
    ctx,
    shots,
    get locked() {
      return locked;
    },
    get velocity() {
      return velocity;
    },
    get state() {
      return state;
    },
    get telegraph() {
      return telegraph;
    },
    get hitbox() {
      return hitbox;
    },
  };
}

async function unlockAndReachRuins() {
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({
    type: 'RECORD_DIALOGUE',
    npcId: 'seria',
    playerText: '폐허에 대해 알고 있는 게 있어?',
    npcText: '폐허에서 이상한 마력이 느껴지고 있어.',
  });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER });
  if (orch.getState().mode === 'COMBAT') {
    await orch.dispatch({
      type: 'RESOLVE_COMBAT',
      result: {
        combatId: ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER,
        outcome: 'VICTORY',
        player: { remainingHp: 80, remainingMp: 40 },
        defeatedEnemyIds: ['key_holder_goblin_001'],
        defeatedEnemyTypes: ['goblin'],
      },
    });
  }
  if (orch.getState().world.currentLocationId !== LOCATION_ID.FOREST_ROAD) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  }
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS });
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: ENCOUNTER_ID.RUINS_MIXED_01,
      outcome: 'VICTORY',
      player: { remainingHp: 80, remainingMp: 40 },
      defeatedEnemyIds: ['goblin_001', 'goblin_002', 'archer_001'],
      defeatedEnemyTypes: ['goblin', 'goblin', 'archer'],
    },
  });
  return orch;
}

async function discoverSeal(orch: ReturnType<typeof createGameOrchestrator>) {
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_INVESTIGATE_ALTAR });
  if (getAvailableChoices(orch.getState()).some((choice) => choice.id === 'touch_magic_stone')) {
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'touch_magic_stone' });
  }
}

async function startGuardianCombat(orch: ReturnType<typeof createGameOrchestrator>) {
  if (getAvailableChoices(orch.getState()).some((choice) => choice.id === CHOICE_FIGHT_GUARDIAN)) {
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_FIGHT_GUARDIAN });
  }
  if (orch.getState().mode !== 'COMBAT') {
    await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 });
  }
}

function victoryResult() {
  return {
    combatId: ENCOUNTER_ID.RUINS_BOSS_01,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 30 },
    defeatedEnemyIds: [BOSS_INSTANCE_ID.RUINS_GUARDIAN],
    defeatedEnemyTypes: [BOSS_ID.RUINS_GUARDIAN],
  };
}

function defeatResult() {
  return {
    combatId: ENCOUNTER_ID.RUINS_BOSS_01,
    outcome: 'DEFEAT' as const,
    player: { remainingHp: 0, remainingMp: 10 },
    defeatedEnemyIds: [] as string[],
    defeatedEnemyTypes: [] as string[],
  };
}

export async function runStep25BossScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const definition = getBossDefinition(BOSS_ID.RUINS_GUARDIAN);
  const runtime = createBossRuntime(BOSS_DEFINITIONS.RUINS_GUARDIAN);
  if (
    definition &&
    definition.maxHp === 2000 &&
    runtime.currentHp === 2000 &&
    runtime.instanceId === BOSS_INSTANCE_ID.RUINS_GUARDIAN &&
    runtime.currentPhase === 1 &&
    BOSS_DEFINITIONS.RUINS_GUARDIAN.maxHp === 2000
  ) {
    pass('definition-runtime', `hp ${definition.maxHp} phase ${runtime.currentPhase}`);
  } else {
    fail('definition-runtime', JSON.stringify({ definition, runtime }));
  }

  const encounter = getEncounter(ENCOUNTER_ID.RUINS_BOSS_01);
  if (
    encounter?.bossId === BOSS_ID.RUINS_GUARDIAN &&
    encounter.bossInstanceId === BOSS_INSTANCE_ID.RUINS_GUARDIAN &&
    encounter.enemies.length === 0 &&
    isStartableCombatId(ENCOUNTER_ID.RUINS_BOSS_01) &&
    isBossEncounter(ENCOUNTER_ID.RUINS_BOSS_01)
  ) {
    pass('A-encounter', encounter.id);
  } else {
    fail('A-encounter', JSON.stringify(encounter));
  }

  const orchA = await unlockAndReachRuins();
  await discoverSeal(orchA);
  await startGuardianCombat(orchA);
  const afterStart = orchA.getState();
  const config = buildCombatConfig(afterStart, ENCOUNTER_ID.RUINS_BOSS_01);
  if (
    afterStart.mode === 'COMBAT' &&
    afterStart.activeCombatId === ENCOUNTER_ID.RUINS_BOSS_01 &&
    config?.encounterId === ENCOUNTER_ID.RUINS_BOSS_01 &&
    config.arenaId === 'ruins_guardian_arena'
  ) {
    pass('A-start', `${afterStart.story.currentSceneId} -> ${afterStart.activeCombatId} ${config.arenaId}`);
  } else {
    fail(
      'A-start',
      JSON.stringify({
        scene: afterStart.story.currentSceneId,
        mode: afterStart.mode,
        combatId: afterStart.activeCombatId,
        config,
      })
    );
  }

  const slam = new HeavySlamPattern();
  const slamMock = createMockContext(1);
  slam.start(slamMock.ctx);
  slam.update(100, slamMock.ctx);
  const windupTelegraph = slamMock.telegraph === 'slam' && !slamMock.hitbox.active;
  slam.update(900, slamMock.ctx);
  const activeHit = slamMock.state === 'ATTACKING' && slamMock.hitbox.active;
  slam.update(280, slamMock.ctx);
  const recovery = slamMock.state === 'RECOVERY' && !slamMock.hitbox.active;
  if (windupTelegraph && activeHit && recovery) {
    pass('B-slam', `${slamMock.state} telegraph ${slamMock.telegraph ?? 'hidden'}`);
  } else {
    fail('B-slam', JSON.stringify({ windupTelegraph, activeHit, recovery, state: slamMock.state, hitbox: slamMock.hitbox }));
  }

  const burst = new ProjectileBurstPattern();
  const burst1 = createMockContext(1);
  burst.start(burst1.ctx);
  burst.update(RUINS_GUARDIAN_CONFIG.projectileBurst.windUpMs + 40, burst1.ctx);
  const burst2 = createMockContext(2);
  const burstPhase2 = new ProjectileBurstPattern();
  burstPhase2.start(burst2.ctx);
  burstPhase2.update(RUINS_GUARDIAN_CONFIG.projectileBurst.windUpMs + 40, burst2.ctx);
  if (burst1.shots.length === 3 && burst2.shots.length === 5 && burst1.shots.every((shot) => shot.sourceId === 'ruins_guardian_001')) {
    pass('C-burst', `p1 ${burst1.shots.length} p2 ${burst2.shots.length}`);
  } else {
    fail('C-burst', JSON.stringify({ p1: burst1.shots.length, p2: burst2.shots.length }));
  }

  const charge = new ChargePattern();
  const chargeMock = createMockContext(1);
  charge.start(chargeMock.ctx);
  const lockedAtStart = { ...chargeMock.locked };
  chargeMock.ctx.playerY = 80;
  charge.update(RUINS_GUARDIAN_CONFIG.charge.windUpMs + 20, chargeMock.ctx);
  const stillLocked =
    Math.abs(chargeMock.locked.x - lockedAtStart.x) < 0.001 && Math.abs(chargeMock.locked.y - lockedAtStart.y) < 0.001;
  const chargingForward = chargeMock.velocity.x > 0 && Math.abs(chargeMock.velocity.y) < 0.001;
  chargeMock.ctx.x = 16;
  const hitBound = chargeMock.ctx.clampToArena();
  if (stillLocked && chargingForward && hitBound) {
    pass('D-charge', `lock ${lockedAtStart.x.toFixed(2)} bound ${hitBound}`);
  } else {
    fail('D-charge', JSON.stringify({ stillLocked, chargingForward, hitBound, velocity: chargeMock.velocity }));
  }

  const phaseRuntime = createBossRuntime(BOSS_DEFINITIONS.RUINS_GUARDIAN);
  const before = shouldTriggerPhase2(phaseRuntime, 1000);
  phaseRuntime.currentHp = 500;
  const atThreshold = shouldTriggerPhase2(phaseRuntime, 1000);
  phaseRuntime.phaseTransitionTriggered = true;
  const again = shouldTriggerPhase2(phaseRuntime, 1000);
  const controller = new BossPatternController(BOSS_DEFINITIONS.RUINS_GUARDIAN);
  const p1Delay = BOSS_DEFINITIONS.RUINS_GUARDIAN.phaseDefinitions[0]?.patternDelayMs;
  const p2Delay = BOSS_DEFINITIONS.RUINS_GUARDIAN.phaseDefinitions[1]?.patternDelayMs;
  const p1First = controller.peekNextPatternId(1);
  controller.beginPhase(2);
  const p2First = controller.peekNextPatternId(2);
  if (
    !before &&
    atThreshold &&
    !again &&
    p1Delay === 700 &&
    p2Delay === 420 &&
    p2Delay < p1Delay &&
    p1First === BOSS_PATTERN_ID.HEAVY_SLAM &&
    p2First === BOSS_PATTERN_ID.PROJECTILE_BURST
  ) {
    pass('E-phase', `once ${atThreshold} delay ${p1Delay}->${p2Delay} p2start ${p2First}`);
  } else {
    fail('E-phase', JSON.stringify({ before, atThreshold, again, p1Delay, p2Delay, p1First, p2First }));
  }

  const warriorAttack = BASIC_ATTACKS.warrior_slash;
  const guardReduction = applyDamageReduction(RUINS_GUARDIAN_CONFIG.heavySlam.damage, SKILLS.warrior_guard.damageReduction ?? 0.7);
  const warriorDash = getDashProfile(PLAYER_CLASS_ID.WARRIOR);
  if (warriorAttack && guardReduction < RUINS_GUARDIAN_CONFIG.heavySlam.damage && warriorDash.style === 'dash' && SKILLS.warrior_charge_slash.implemented) {
    pass('F-warrior', `guard ${RUINS_GUARDIAN_CONFIG.heavySlam.damage}->${guardReduction} dash ${warriorDash.style}`);
  } else {
    fail('F-warrior', JSON.stringify({ warriorAttack, guardReduction, warriorDash }));
  }

  const mageDash = getDashProfile(PLAYER_CLASS_ID.MAGE);
  const slowed = bossSlowMultiplier(
    SKILLS.mage_frost_nova.slowMultiplier ?? 0.4,
    BOSS_DEFINITIONS.RUINS_GUARDIAN.statusResistance.slowEffectiveness
  );
  if (
    SKILLS.mage_fireball.implemented &&
    SKILLS.mage_frost_nova.implemented &&
    mageDash.style === 'blink' &&
    slowed > (SKILLS.mage_frost_nova.slowMultiplier ?? 0.4) &&
    slowed < 1
  ) {
    pass('G-mage', `blink ${mageDash.style} slow ${slowed.toFixed(2)} (reduced, not immune)`);
  } else {
    fail('G-mage', JSON.stringify({ mageDash, slowed }));
  }

  const facing = { x: 1, y: 0 };
  const fromBehind = isBackAttack({ x: 0, y: 0 }, { x: 40, y: 0 }, facing);
  const fromFront = isBackAttack({ x: 80, y: 0 }, { x: 40, y: 0 }, facing);
  const backDamage = backstabDamage(SKILLS.rogue_backstab.damage ?? 35, SKILLS.rogue_backstab.backDamage ?? 60, fromBehind);
  const rogueDash = getDashProfile(PLAYER_CLASS_ID.ROGUE);
  if (fromBehind && !fromFront && backDamage > 35 && rogueDash.style === 'dash' && SKILLS.rogue_shadow_dash.implemented) {
    pass('H-rogue', `backstab ${backDamage} dash ${rogueDash.style}`);
  } else {
    fail('H-rogue', JSON.stringify({ fromBehind, fromFront, backDamage, rogueDash }));
  }

  const orchI = await unlockAndReachRuins();
  await orchI.dispatch({ type: 'SET_PLAYER_CLASS', classId: PLAYER_CLASS_ID.WARRIOR });
  await discoverSeal(orchI);
  await startGuardianCombat(orchI);
  await orchI.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult() });
  const won = orchI.getState();
  const questDone = won.quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.win_guardian?.completed;
  if (
    won.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED] &&
    won.world.facts.some((fact) => fact.id === RUINS_GUARDIAN_FACT_ID && fact.type === 'IMPORTANT_EVENT') &&
    doesPlayerKnowFact(won, RUINS_GUARDIAN_FACT_ID) &&
    questDone &&
    won.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY &&
    won.story.narration.includes('마력이 서서히 흩어진다')
  ) {
    pass('I-victory', won.story.currentSceneId);
  } else {
    fail(
      'I-victory',
      JSON.stringify({
        flag: won.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED],
        fact: won.world.facts.map((fact) => fact.id),
        knows: doesPlayerKnowFact(won, RUINS_GUARDIAN_FACT_ID),
        questDone,
        scene: won.story.currentSceneId,
        narr: won.story.narration,
      })
    );
  }

  const orchJ = await unlockAndReachRuins();
  await discoverSeal(orchJ);
  await startGuardianCombat(orchJ);
  const saveBlocked = !canSaveGame(orchJ.getState());
  await orchJ.dispatch({ type: 'RESOLVE_COMBAT', result: defeatResult() });
  const lost = orchJ.getState();
  const resetRuntime = createBossRuntime(BOSS_DEFINITIONS.RUINS_GUARDIAN);
  controller.reset();
  if (
    lost.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_DEFEAT &&
    lost.world.flags[WORLD_FLAG.RUINS_GUARDIAN_LOST] &&
    !lost.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED] &&
    resetRuntime.currentHp === 2000 &&
    resetRuntime.currentPhase === 1 &&
    saveBlocked
  ) {
    pass('J-defeat', `${lost.story.currentSceneId} runtime reset hp ${resetRuntime.currentHp}`);
  } else {
    fail('J-defeat', JSON.stringify({ scene: lost.story.currentSceneId, flags: lost.world.flags, resetRuntime, saveBlocked }));
  }

  const orchK = await unlockAndReachRuins();
  await discoverSeal(orchK);
  await orchK.dispatch({ type: 'MOVE_NPC', npcId: 'seria', locationId: LOCATION_ID.ANCIENT_RUINS });
  await startGuardianCombat(orchK);
  await orchK.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult() });
  const known = orchK.getState();
  if (
    doesPlayerKnowFact(known, RUINS_GUARDIAN_FACT_ID) &&
    doesNpcKnowFact(known, 'seria', RUINS_GUARDIAN_FACT_ID) &&
    !doesNpcKnowFact(known, 'leon', RUINS_GUARDIAN_FACT_ID) &&
    known.npcs.leon.locationId === LOCATION_ID.NORTHERN_GATE
  ) {
    pass('K-knowledge', 'player+seria yes, leon no');
  } else {
    fail(
      'K-knowledge',
      JSON.stringify({
        player: doesPlayerKnowFact(known, RUINS_GUARDIAN_FACT_ID),
        seria: doesNpcKnowFact(known, 'seria', RUINS_GUARDIAN_FACT_ID),
        leon: doesNpcKnowFact(known, 'leon', RUINS_GUARDIAN_FACT_ID),
        leonLoc: known.npcs.leon.locationId,
        seriaLoc: known.npcs.seria.locationId,
      })
    );
  }

  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(known, undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const loadOrch = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storage) });
  await loadOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = loadOrch.getState();
  if (
    loaded.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED] &&
    loaded.quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.win_guardian?.completed &&
    doesPlayerKnowFact(loaded, RUINS_GUARDIAN_FACT_ID) &&
    doesNpcKnowFact(loaded, 'seria', RUINS_GUARDIAN_FACT_ID) &&
    !doesNpcKnowFact(loaded, 'leon', RUINS_GUARDIAN_FACT_ID) &&
    loaded.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY
  ) {
    pass('L-save', loaded.story.currentSceneId);
  } else {
    fail(
      'L-save',
      JSON.stringify({
        flag: loaded.world.flags[WORLD_FLAG.RUINS_GUARDIAN_DEFEATED],
        quest: loaded.quests[QUEST_ID.RUINS_MYSTERY]?.objectiveProgress.win_guardian,
        scene: loaded.story.currentSceneId,
      })
    );
  }

  const goblin = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.GOBLIN];
  const archer = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.ARCHER];
  const brute = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.BRUTE];
  const mixed = getEncounter(ENCOUNTER_ID.RUINS_MIXED_01);
  const mixedVictory = isVictoryByAliveCount(0, mixed?.enemies.length ?? 0);
  if (goblin && archer && brute && mixed?.enemies.length === 3 && mixedVictory && !mixed.bossId) {
    pass('M-regression-defs', `goblin/archer/brute + mixed ${mixed.enemies.length}`);
  } else {
    fail('M-regression-defs', JSON.stringify({ goblin: goblin.maxHp, mixed: mixed?.enemies.length, mixedVictory }));
  }

  const encounterLines = await runStep21EncounterScenarios();
  const encounterFailed = encounterLines.filter((line) => line.startsWith('FAIL'));
  if (encounterFailed.length === 0) {
    pass('M-regression-encounters', `${encounterLines.filter((line) => line.startsWith('PASS')).length} encounter checks`);
  } else {
    fail('M-regression-encounters', encounterFailed.join(' | '));
  }

  const storyLines = await runStep24StoryScenarios();
  const storyFailed = storyLines.filter((line) => line.startsWith('FAIL'));
  if (storyFailed.length === 0) {
    pass('M-regression-story', `${storyLines.filter((line) => line.startsWith('PASS')).length} story checks`);
  } else {
    fail('M-regression-story', storyFailed.join(' | '));
  }

  const debug = formatBossDebug({
    hp: 1000,
    maxHp: 1000,
    phase: 1,
    state: 'IDLE',
    nextPatternId: 'heavy_slam',
    cooldownMs: 1100,
  });
  if (debug.includes('PHASE 1') && debug.includes('IDLE') && debug.includes('NEXT')) {
    pass('hud-debug', 'boss debug panel text');
  } else {
    fail('hud-debug', debug);
  }

  const classOrch = await unlockAndReachRuins();
  await classOrch.dispatch({ type: 'SET_PLAYER_CLASS', classId: PLAYER_CLASS_ID.MAGE });
  await discoverSeal(classOrch);
  await startGuardianCombat(classOrch);
  await classOrch.dispatch({ type: 'RESOLVE_COMBAT', result: victoryResult() });
  const mageVictory = classOrch.getState();
  const afterVictoryChoices = getAvailableChoices(mageVictory).map((choice) => choice.id);
  const sharedAftermath = afterVictoryChoices.includes('investigate_guardian_core');
  const warriorLockedOut = afterVictoryChoices.includes('guardian_victory_warrior');
  if (
    mageVictory.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_VICTORY &&
    mageVictory.player.classId === PLAYER_CLASS_ID.MAGE &&
    sharedAftermath &&
    !warriorLockedOut
  ) {
    pass('class-flavor', 'mage class kept, shared after-victory scene');
  } else {
    fail('class-flavor', JSON.stringify({ scene: mageVictory.story.currentSceneId, afterVictoryChoices, warriorLockedOut }));
  }

  return lines;
}
