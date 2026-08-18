import { createGameOrchestrator } from '../../core/orchestrator';
import { applyEvents } from '../../core/reducer';
import { createInitialGameState } from '../../core/initial-state';
import { buildCombatConfig } from '../build-combat-config';
import { PLAYER_CLASS_ID, PLAYER_CLASSES, getStoredPlayerClassId } from '../../player/classes';
import { TEST_GOBLIN_COMBAT_ID, TEST_GOBLIN_ENEMY_ID } from '../../story/test-scenes';
import { createMemoryStorage, createSaveService, parsePersistedGameState, toPersistedGameState } from '../../save';
import { SkillController } from './SkillController';
import { createSkillExecutors } from './skill-executors';
import { SKILLS } from './skill-definitions';
import { aimDirection, createProjectile, projectileHitsTarget, updateProjectiles } from '../projectiles/projectile-runtime';
import type { CombatProjectile } from '../projectiles/projectile-types';
import type { SkillExecutionContext } from './skill-types';
import type { PlayerClassId } from '../../player/classes/class-types';

function createVitals(initialMp: number) {
  let currentMp = initialMp;
  let dead = false;
  let locked = false;
  return {
    vitals: {
      isDead: () => dead,
      isCombatLocked: () => locked,
      currentMp: () => currentMp,
      consumeMp: (amount: number) => {
        if (currentMp < amount) {
          return false;
        }
        currentMp -= amount;
        return true;
      },
    },
    getMp: () => currentMp,
    setDead: (value: boolean) => {
      dead = value;
    },
    setLocked: (value: boolean) => {
      locked = value;
    },
  };
}

function spawnFromContext(context: SkillExecutionContext, list: CombatProjectile[]): CombatProjectile {
  const direction = aimDirection(context.playerX, context.playerY, context.pointerX, context.pointerY);
  const projectile = createProjectile({
    id: list.length + 1,
    skillId: context.skill.id,
    x: context.playerX,
    y: context.playerY,
    dirX: direction.x,
    dirY: direction.y,
    speed: context.skill.projectileSpeed ?? 420,
    damage: context.skill.damage ?? 30,
    lifetimeMs: context.skill.durationMs ?? 1400,
    radius: 8,
    attackId: 10_000 + list.length,
  });
  list.push(projectile);
  return projectile;
}

function createMageSkills(mp: number, spawned: CombatProjectile[]) {
  const pool = createVitals(mp);
  const controller = new SkillController({
    classId: PLAYER_CLASS_ID.MAGE,
    vitals: pool.vitals,
    aim: {
      playerX: () => 0,
      playerY: () => 0,
      pointerX: () => 200,
      pointerY: () => 0,
    },
    executors: createSkillExecutors({
      spawnFireball: (context) => {
        spawnFromContext(context, spawned);
      },
    }),
  });
  return { controller, pool };
}

export async function runStep19ClassSkillScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const classIds: PlayerClassId[] = [PLAYER_CLASS_ID.WARRIOR, PLAYER_CLASS_ID.MAGE, PLAYER_CLASS_ID.ROGUE];
  const classResults = classIds.map((classId) => {
    const state = applyEvents(createInitialGameState(), [{ type: 'PLAYER_CLASS_UPDATED', classId }]);
    const config = buildCombatConfig(state, TEST_GOBLIN_COMBAT_ID);
    const definition = PLAYER_CLASSES[classId];
    return {
      classId,
      stored: getStoredPlayerClassId(state.player),
      config,
      expected: definition.baseStats,
      skills: state.player.skills.map((skill) => skill.id),
    };
  });
  const classOk = classResults.every(
    (item) =>
      item.config?.player.classId === item.classId &&
      item.stored === item.classId &&
      item.config.player.maxHp === item.expected.maxHp &&
      item.config.player.maxMp === item.expected.maxMp &&
      item.config.player.moveSpeed === item.expected.moveSpeed &&
      item.config.player.currentMp === item.expected.maxMp
  );
  if (classOk) {
    pass(
      'A-class',
      classResults.map((item) => `${item.classId}:${item.config?.player.maxHp}/${item.config?.player.maxMp}/${item.config?.player.moveSpeed}`).join(' ')
    );
  } else {
    fail('A-class', JSON.stringify(classResults.map((item) => item.config?.player)));
  }

  const spawnedB: CombatProjectile[] = [];
  const mageB = createMageSkills(150, spawnedB);
  const usedB = mageB.controller.tryUse('Q');
  const bounds = { left: 0, top: 0, right: 800, bottom: 600 };
  const enemy = { x: 200, y: 0, radius: 16, hp: 100 };
  let flying = spawnedB.slice();
  let hit = false;
  for (let elapsed = 0; elapsed < 2000 && flying.length > 0; elapsed += 16) {
    flying = updateProjectiles(flying, 16, bounds);
    const remaining: CombatProjectile[] = [];
    for (const projectile of flying) {
      if (projectileHitsTarget(projectile, enemy)) {
        enemy.hp -= projectile.damage;
        hit = true;
      } else {
        remaining.push(projectile);
      }
    }
    flying = remaining;
  }
  if (
    usedB.ok &&
    usedB.skillId === 'mage_fireball' &&
    spawnedB.length === 1 &&
    spawnedB[0]?.dirX > 0.99 &&
    hit &&
    enemy.hp === 100 - (SKILLS.mage_fireball.damage ?? 0) &&
    flying.length === 0
  ) {
    pass('B-fireball', `damage ${100 - enemy.hp} dirX ${spawnedB[0]?.dirX.toFixed(2)} remaining ${flying.length}`);
  } else {
    fail('B-fireball', JSON.stringify({ usedB, spawned: spawnedB.length, hp: enemy.hp, hit, remaining: flying.length }));
  }

  const spawnedC: CombatProjectile[] = [];
  const mageC = createMageSkills(100, spawnedC);
  const firstC = mageC.controller.tryUse('Q');
  const mpAfter = mageC.pool.getMp();
  const low = createMageSkills(10, []);
  const blocked = low.controller.tryUse('Q');
  if (firstC.ok && mpAfter === 85 && blocked.ok === false && blocked.reason === 'MP') {
    pass('C-mp', `100-15=${mpAfter} low=${blocked.reason}`);
  } else {
    fail('C-mp', JSON.stringify({ firstC, mpAfter, blocked }));
  }

  const spawnedD: CombatProjectile[] = [];
  const mageD = createMageSkills(150, spawnedD);
  const firstD = mageD.controller.tryUse('Q');
  const spamD = mageD.controller.tryUse('Q');
  mageD.controller.update(SKILLS.mage_fireball.cooldownMs - 1);
  const stillCooling = mageD.controller.tryUse('Q');
  mageD.controller.update(2);
  const readyD = mageD.controller.tryUse('Q');
  if (
    firstD.ok &&
    spamD.ok === false &&
    spamD.reason === 'COOLDOWN' &&
    stillCooling.ok === false &&
    stillCooling.reason === 'COOLDOWN' &&
    readyD.ok &&
    spawnedD.length === 2
  ) {
    pass('D-cooldown', `shots ${spawnedD.length} cooldown ${SKILLS.mage_fireball.cooldownMs}ms`);
  } else {
    fail('D-cooldown', JSON.stringify({ firstD, spamD, stillCooling, readyD, shots: spawnedD.length }));
  }

  const warriorSpawned: CombatProjectile[] = [];
  const warrior = new SkillController({
    classId: PLAYER_CLASS_ID.WARRIOR,
    vitals: createVitals(60).vitals,
    aim: {
      playerX: () => 0,
      playerY: () => 0,
      pointerX: () => 200,
      pointerY: () => 0,
    },
    executors: createSkillExecutors({
      spawnFireball: (context) => {
        spawnFromContext(context, warriorSpawned);
      },
    }),
  });
  const warriorQ = warrior.tryUse('Q');
  if (
    warriorQ.ok === false &&
    warriorQ.reason === 'NOT_IMPLEMENTED' &&
    warriorSpawned.length === 0 &&
    warrior.getLastExecutedSkillId() === null &&
    warrior.getSkill('Q')?.id === 'warrior_charge_slash'
  ) {
    pass('E-warrior-q', `${warrior.getSkill('Q')?.id} ${warriorQ.reason}`);
  } else {
    fail('E-warrior-q', JSON.stringify({ warriorQ, spawned: warriorSpawned.length, skill: warrior.getSkill('Q')?.id }));
  }

  const orchF = createGameOrchestrator(
    applyEvents(createInitialGameState(), [
      { type: 'PLAYER_CLASS_UPDATED', classId: PLAYER_CLASS_ID.MAGE },
      { type: 'PLAYER_COMBAT_MP_UPDATED', currentMp: 100 },
    ])
  );
  await orchF.dispatch({ type: 'START_COMBAT', combatId: TEST_GOBLIN_COMBAT_ID });
  await orchF.dispatch({
    type: 'RESOLVE_COMBAT',
    result: {
      combatId: TEST_GOBLIN_COMBAT_ID,
      outcome: 'VICTORY',
      player: { remainingHp: 70, remainingMp: 85 },
      defeatedEnemyIds: [TEST_GOBLIN_ENEMY_ID],
    },
  });
  const loadedF = orchF.getState();
  if (loadedF.player.classId === PLAYER_CLASS_ID.MAGE && loadedF.player.currentHp >= 70 && loadedF.player.currentMp >= 85) {
    pass('F-combat-result', `hp ${loadedF.player.currentHp} mp ${loadedF.player.currentMp}`);
  } else {
    fail('F-combat-result', JSON.stringify({ hp: loadedF.player.currentHp, mp: loadedF.player.currentMp, classId: loadedF.player.classId }));
  }

  const storage = createMemoryStorage();
  const saveState = applyEvents(createInitialGameState(), [
    { type: 'PLAYER_CLASS_UPDATED', classId: PLAYER_CLASS_ID.MAGE },
    { type: 'PLAYER_COMBAT_MP_UPDATED', currentMp: 120 },
  ]);
  const orchSave = createGameOrchestrator(saveState, undefined, { saveService: createSaveService(storage) });
  await orchSave.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  await orchSave.dispatch({ type: 'SET_PLAYER_CLASS', classId: PLAYER_CLASS_ID.WARRIOR });
  await orchSave.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const restored = orchSave.getState();
  const persisted = toPersistedGameState(saveState, 0);
  const playerWithoutMp = {
    ...persisted.player,
    maxMp: undefined,
    currentMp: undefined,
  };
  const migrated = parsePersistedGameState({
    ...persisted,
    player: playerWithoutMp,
  });
  if (
    restored.player.classId === PLAYER_CLASS_ID.MAGE &&
    restored.player.currentMp === 120 &&
    restored.player.skills.some((skill) => skill.id === 'mage_fireball') &&
    migrated?.player.maxMp === PLAYER_CLASSES.mage.baseStats.maxMp &&
    migrated.player.currentMp === PLAYER_CLASSES.mage.baseStats.maxMp
  ) {
    pass('save-mp-class', `mp ${restored.player.currentMp} migrated ${migrated.player.maxMp}`);
  } else {
    fail(
      'save-mp-class',
      JSON.stringify({
        classId: restored.player.classId,
        mp: restored.player.currentMp,
        skills: restored.player.skills,
        migrated,
      })
    );
  }

  const lifetime = createProjectile({
    id: 1,
    skillId: 'mage_fireball',
    x: 10,
    y: 10,
    dirX: 1,
    dirY: 0,
    speed: 400,
    damage: 30,
    lifetimeMs: 30,
    radius: 8,
    attackId: 1,
  });
  const afterLife = updateProjectiles([lifetime], 40, bounds);
  const out = createProjectile({
    id: 2,
    skillId: 'mage_fireball',
    x: 790,
    y: 10,
    dirX: 1,
    dirY: 0,
    speed: 400,
    damage: 30,
    lifetimeMs: 1400,
    radius: 8,
    attackId: 2,
  });
  const afterBounds = updateProjectiles([out], 100, bounds);
  if (afterLife.length === 0 && afterBounds.length === 0) {
    pass('projectile-cleanup', 'lifetime and bounds removed');
  } else {
    fail('projectile-cleanup', JSON.stringify({ afterLife: afterLife.length, afterBounds: afterBounds.length }));
  }

  return lines;
}
