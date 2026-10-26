import { createGameOrchestrator } from '../../core/orchestrator';
import { applyEvents } from '../../core/reducer';
import { createInitialGameState } from '../../core/initial-state';
import { buildCombatConfig } from '../build-combat-config';
import { PLAYER_CLASS_ID, PLAYER_CLASSES } from '../../player/classes';
import { TEST_GOBLIN_COMBAT_ID, TEST_GOBLIN_ENEMY_ID } from '../../story/test-scenes';
import { ENEMY_DEFINITIONS } from '../enemies/enemy-definitions';
import { ENEMY_BEHAVIOR_TYPE, ENEMY_TYPE_ID } from '../enemies/enemy-types';
import { MeleeBehavior } from '../enemies/behaviors/MeleeBehavior';
import { RangedBehavior } from '../enemies/behaviors/RangedBehavior';
import { HeavyMeleeBehavior } from '../enemies/behaviors/HeavyMeleeBehavior';
import { computeSeparationDeltas, shouldApplyAttackHit } from '../enemies/enemy-separation';
import type { EnemyBehaviorContext } from '../enemies/behaviors/behavior-types';
import {
  ENCOUNTER_ID,
  ENCOUNTERS,
  cloneEncounter,
  getEncounter,
  isStartableCombatId,
  isVictoryByAliveCount,
  resolveEncounterId,
} from '../encounters/encounter-definitions';
import { createProjectile, projectileHitsTarget } from '../projectiles/projectile-runtime';
import { collectTargetsInRadius } from '../skills/skill-combat-rules';
import { SKILLS } from '../skills/skill-definitions';
import { createCombatFacts } from '../../world/facts/fact-service';
import { runCombatPressureScenarios } from '../arenas/combat-pressure-scenarios';
import { runEncounterStartScenarios } from './encounter-start-scenarios';

function contextFor(
  definition: (typeof ENEMY_DEFINITIONS)[keyof typeof ENEMY_DEFINITIONS],
  overrides: Partial<EnemyBehaviorContext>
): EnemyBehaviorContext {
  return {
    x: 0,
    y: 0,
    playerX: 200,
    playerY: 0,
    playerVx: 0,
    playerVy: 0,
    homeX: 0,
    homeY: 0,
    distance: 200,
    isPlayerAlive: true,
    isAttacking: false,
    knockbackActive: false,
    moveSpeed: definition.moveSpeed,
    definition,
    formationIndex: 0,
    aliveCount: 1,
    hasMeleeToken: true,
    ...overrides,
  };
}

export async function runStep21EncounterScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const goblin = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.GOBLIN];
  const archer = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.ARCHER];
  const brute = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.BRUTE];
  if (
    goblin.behaviorType === ENEMY_BEHAVIOR_TYPE.MELEE &&
    goblin.maxHp === 108 &&
    goblin.moveSpeed > archer.moveSpeed &&
    goblin.attackCooldownMs === 900
  ) {
    pass('A-goblin', `hp ${goblin.maxHp} speed ${goblin.moveSpeed} cd ${goblin.attackCooldownMs}`);
  } else {
    fail('A-goblin', JSON.stringify(goblin));
  }

  const melee = new MeleeBehavior();
  const chase = melee.chooseMove(contextFor(goblin, { distance: 180, playerX: 180 }));
  const stop = melee.chooseMove(contextFor(goblin, { x: 0, playerX: 40, distance: 40 }));
  const canHit = melee.shouldStartAttack(contextFor(goblin, { distance: 40 }));
  if (chase.vx > 0 && stop.vx === 0 && canHit) {
    pass('A-goblin-behavior', `chase ${chase.vx.toFixed(0)} stop-and-attack`);
  } else {
    fail('A-goblin-behavior', JSON.stringify({ chase, stop, canHit }));
  }

  const easy = getEncounter(ENCOUNTER_ID.RUINS_EASY_01);
  if (
    easy?.enemies.length === 1 &&
    easy.enemies[0]?.enemyType === ENEMY_TYPE_ID.GOBLIN &&
    easy.enemies[0]?.instanceId === TEST_GOBLIN_ENEMY_ID &&
    resolveEncounterId(TEST_GOBLIN_COMBAT_ID) === ENCOUNTER_ID.RUINS_EASY_01
  ) {
    pass('A-encounter', `${easy.id} ${easy.enemies[0].instanceId}`);
  } else {
    fail('A-encounter', JSON.stringify(easy));
  }

  const ranged = new RangedBehavior();
  const approach = ranged.chooseMove(contextFor(archer, { distance: 400, playerX: 400 }));
  const hold = ranged.chooseMove(contextFor(archer, { distance: 270, playerX: 270 }));
  const retreat = ranged.chooseMove(contextFor(archer, { distance: 80, playerX: 80 }));
  const canShoot = ranged.shouldStartAttack(contextFor(archer, { distance: 270 }));
  const tooClose = ranged.shouldStartAttack(contextFor(archer, { distance: 40 }));
  if (
    archer.behaviorType === ENEMY_BEHAVIOR_TYPE.RANGED &&
    archer.maxHp === 72 &&
    approach.vx > 0 &&
    Math.abs(hold.vx) < archer.moveSpeed * 0.4 &&
    retreat.vx < 0 &&
    canShoot &&
    !tooClose &&
    archer.telegraphMs >= 300 &&
    archer.telegraphMs <= 500
  ) {
    pass('B-archer', `approach/hold/retreat telegraph ${archer.telegraphMs}ms`);
  } else {
    fail('B-archer', JSON.stringify({ approach, hold, retreat, canShoot, tooClose, archer }));
  }

  const enemyShot = createProjectile({
    id: 1,
    skillId: 'enemy_shot',
    x: 0,
    y: 0,
    dirX: 1,
    dirY: 0,
    speed: archer.projectileSpeed ?? 320,
    damage: archer.damage,
    lifetimeMs: archer.projectileLifetimeMs ?? 1400,
    radius: archer.projectileRadius ?? 7,
    attackId: 77,
    owner: 'enemy',
  });
  const hitsPlayer = projectileHitsTarget(enemyShot, { x: 10, y: 0, radius: 16 });
  const missesAlly = projectileHitsTarget(enemyShot, { x: 400, y: 0, radius: 14 });
  if (enemyShot.owner === 'enemy' && hitsPlayer && !missesAlly) {
    pass('B-projectile', `owner ${enemyShot.owner} damage ${enemyShot.damage}`);
  } else {
    fail('B-projectile', JSON.stringify({ owner: enemyShot.owner, hitsPlayer, missesAlly }));
  }

  const heavy = new HeavyMeleeBehavior();
  const slowChase = heavy.chooseMove(contextFor(brute, { distance: 200, playerX: 200 }));
  if (
    brute.behaviorType === ENEMY_BEHAVIOR_TYPE.HEAVY_MELEE &&
    brute.maxHp === 160 &&
    brute.damage === 26 &&
    brute.moveSpeed < goblin.moveSpeed &&
    brute.telegraphMs >= 500 &&
    brute.attackCooldownMs === 1600 &&
    slowChase.vx > 0 &&
    slowChase.vx < chase.vx
  ) {
    pass('C-brute', `hp ${brute.maxHp} dmg ${brute.damage} telegraph ${brute.telegraphMs}ms`);
  } else {
    fail('C-brute', JSON.stringify({ brute, slowChase, chase }));
  }

  const mixed = getEncounter(ENCOUNTER_ID.RUINS_MIXED_01);
  const mixedTypes = mixed?.enemies.map((spawn) => spawn.enemyType) ?? [];
  if (
    mixedTypes.filter((type) => type === ENEMY_TYPE_ID.GOBLIN).length === 2 &&
    mixedTypes.filter((type) => type === ENEMY_TYPE_ID.ARCHER).length === 1 &&
    new Set(mixed?.enemies.map((spawn) => spawn.instanceId)).size === 3
  ) {
    pass('D-mixed', mixedTypes.join('+'));
  } else {
    fail('D-mixed', JSON.stringify(mixed?.enemies));
  }

  const stacked = computeSeparationDeltas([
    { x: 100, y: 100, radius: 14 },
    { x: 102, y: 100, radius: 14 },
  ]);
  if (stacked[0].dx < 0 && stacked[1].dx > 0) {
    pass('D-separation', `dx ${stacked[0].dx.toFixed(2)}/${stacked[1].dx.toFixed(2)}`);
  } else {
    fail('D-separation', JSON.stringify(stacked));
  }

  const attackId = 501;
  const goblinA = shouldApplyAttackHit(-1, attackId);
  const goblinAAgain = shouldApplyAttackHit(attackId, attackId);
  const goblinB = shouldApplyAttackHit(-1, attackId);
  if (goblinA && !goblinAAgain && goblinB) {
    pass('D-multi-hit', 'same attackId hits two instances once each');
  } else {
    fail('D-multi-hit', JSON.stringify({ goblinA, goblinAAgain, goblinB }));
  }

  const novaHits = collectTargetsInRadius(
    { x: 0, y: 0 },
    [
      { id: 'goblin_001', x: 40, y: 0 },
      { id: 'goblin_002', x: 60, y: 0 },
      { id: 'archer_001', x: 240, y: 0 },
    ],
    SKILLS.mage_frost_nova.range ?? 108
  ).map((target) => target.id);
  if (novaHits.length === 2 && novaHits.includes('goblin_001') && novaHits.includes('goblin_002')) {
    pass('D-aoe', novaHits.join(','));
  } else {
    fail('D-aoe', JSON.stringify(novaHits));
  }

  const heavyMix = getEncounter(ENCOUNTER_ID.RUINS_HEAVY_01);
  const heavyTypes = heavyMix?.enemies.map((spawn) => spawn.enemyType) ?? [];
  const cloned = cloneEncounter(ENCOUNTERS[ENCOUNTER_ID.RUINS_HEAVY_01]);
  cloned.enemies.pop();
  if (
    heavyTypes.filter((type) => type === ENEMY_TYPE_ID.BRUTE).length === 1 &&
    heavyTypes.filter((type) => type === ENEMY_TYPE_ID.GOBLIN).length === 2 &&
    ENCOUNTERS[ENCOUNTER_ID.RUINS_HEAVY_01].enemies.length === 3 &&
    cloned.enemies.length === 2 &&
    isVictoryByAliveCount(0, 3) &&
    !isVictoryByAliveCount(1, 3) &&
    !isVictoryByAliveCount(0, 0)
  ) {
    pass('E-heavy', `${heavyTypes.join('+')} restart-safe victory-count`);
  } else {
    fail('E-heavy', JSON.stringify({ heavyTypes, original: ENCOUNTERS[ENCOUNTER_ID.RUINS_HEAVY_01].enemies.length }));
  }

  const classIds = [PLAYER_CLASS_ID.WARRIOR, PLAYER_CLASS_ID.MAGE, PLAYER_CLASS_ID.ROGUE] as const;
  const classConfigs = classIds.map((classId) => {
    const state = applyEvents(createInitialGameState(), [{ type: 'PLAYER_CLASS_UPDATED', classId }]);
    return buildCombatConfig(state, ENCOUNTER_ID.RUINS_MIXED_01);
  });
  const classOk = classConfigs.every(
    (config, index) =>
      config?.encounterId === ENCOUNTER_ID.RUINS_MIXED_01 &&
      config.enemies.length === 3 &&
      config.player.classId === classIds[index] &&
      config.player.maxHp === PLAYER_CLASSES[classIds[index]].baseStats.maxHp
  );
  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_MIXED_01 });
  const started = orch.getState().activeCombatId === ENCOUNTER_ID.RUINS_MIXED_01;
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
  const mixedFacts = createCombatFacts(createInitialGameState(), {
    combatId: ENCOUNTER_ID.RUINS_MIXED_01,
    outcome: 'VICTORY',
    player: { remainingHp: 80 },
    defeatedEnemyIds: ['goblin_001', 'goblin_002', 'archer_001'],
    defeatedEnemyTypes: ['goblin', 'goblin', 'archer'],
  });
  const heavyFacts = createCombatFacts(createInitialGameState(), {
    combatId: ENCOUNTER_ID.RUINS_HEAVY_01,
    outcome: 'VICTORY',
    player: { remainingHp: 50 },
    defeatedEnemyIds: ['brute_001', 'goblin_001', 'goblin_002'],
    defeatedEnemyTypes: ['brute', 'goblin', 'goblin'],
  });
  const storyFacts = createCombatFacts(createInitialGameState(), {
    combatId: TEST_GOBLIN_COMBAT_ID,
    outcome: 'VICTORY',
    player: { remainingHp: 90 },
    defeatedEnemyIds: [TEST_GOBLIN_ENEMY_ID],
  });
  const storyConfig = buildCombatConfig(createInitialGameState(), TEST_GOBLIN_COMBAT_ID);
  if (
    classOk &&
    started &&
    orch.getState().mode === 'STORY' &&
    mixedFacts.filter((fact) => fact.type === 'ENEMY_DEFEATED').length === 0 &&
    mixedFacts.some((fact) => fact.type === 'COMBAT_WON') &&
    heavyFacts.some((fact) => fact.type === 'ENEMY_DEFEATED' && fact.targetIds?.includes('brute_001')) &&
    heavyFacts.filter((fact) => fact.type === 'ENEMY_DEFEATED').length === 1 &&
    storyFacts.some((fact) => fact.type === 'ENEMY_DEFEATED' && fact.targetIds?.includes(TEST_GOBLIN_ENEMY_ID)) &&
    storyConfig?.enemies[0]?.id === TEST_GOBLIN_ENEMY_ID &&
    isStartableCombatId(TEST_GOBLIN_COMBAT_ID) &&
    SKILLS.warrior_charge_slash.implemented &&
    SKILLS.mage_frost_nova.implemented &&
    SKILLS.rogue_backstab.implemented
  ) {
    pass(
      'F-class',
      classIds.join(' ') + ` mixed facts ${mixedFacts.map((fact) => fact.type).join(',')}`
    );
  } else {
    fail(
      'F-class',
      JSON.stringify({
        classOk,
        started,
        mode: orch.getState().mode,
        mixedFacts: mixedFacts.map((fact) => fact.type),
        heavyFacts: heavyFacts.map((fact) => fact.type),
        storyFacts: storyFacts.map((fact) => fact.type),
      })
    );
  }

  lines.push(...runCombatPressureScenarios());
  lines.push(...runEncounterStartScenarios());
  return lines;
}
