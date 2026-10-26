import { applyEvents } from '../../core/reducer';
import { createInitialGameState } from '../../core/initial-state';
import { buildCombatConfig } from '../build-combat-config';
import { BASIC_ATTACKS } from '../attacks/basic-attack-definitions';
import { DASH_PROFILES, PLAYER_CLASS_ID, PLAYER_CLASSES, getDashProfile } from '../../player/classes';
import { TEST_GOBLIN_COMBAT_ID } from '../../story/test-scenes';
import { SkillController } from './SkillController';
import { createSkillExecutors } from './skill-executors';
import { SKILLS, getSkillForSlot } from './skill-definitions';
import {
  applyDamageReduction,
  backstabDamage,
  dashDistancePx,
  inRadius,
  isBackAttack,
  tickTimedModifier,
} from './skill-combat-rules';
import { getClassAppearance } from '../player/class-appearance';

function createVitals(mp: number) {
  let currentMp = mp;
  return {
    isDead: () => false,
    isCombatLocked: () => false,
    currentMp: () => currentMp,
    consumeMp: (amount: number) => {
      if (currentMp < amount) {
        return false;
      }
      currentMp -= amount;
      return true;
    },
  };
}

export function runStep20IdentityScenarios(): string[] {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const warriorAttack = BASIC_ATTACKS.warrior_slash;
  const mageAttack = BASIC_ATTACKS.mage_bolt;
  const rogueAttack = BASIC_ATTACKS.rogue_stab;
  if (
    warriorAttack.type === 'MELEE' &&
    mageAttack.type === 'PROJECTILE' &&
    rogueAttack.type === 'MELEE' &&
    warriorAttack.damage > rogueAttack.damage &&
    warriorAttack.cooldownMs > rogueAttack.cooldownMs &&
    warriorAttack.knockbackScale > rogueAttack.knockbackScale &&
    mageAttack.projectile
  ) {
    pass(
      'A-basic-attack',
      `warrior ${warriorAttack.damage}/${warriorAttack.cooldownMs} rogue ${rogueAttack.damage}/${rogueAttack.cooldownMs} mage bolt`
    );
  } else {
    fail('A-basic-attack', 'profiles are not distinct enough');
  }

  const warriorDash = getDashProfile(PLAYER_CLASS_ID.WARRIOR);
  const mageDash = getDashProfile(PLAYER_CLASS_ID.MAGE);
  const rogueDash = getDashProfile(PLAYER_CLASS_ID.ROGUE);
  const warriorDist = dashDistancePx(warriorDash.speed, warriorDash.durationMs);
  const mageDist = dashDistancePx(mageDash.speed, mageDash.durationMs);
  const rogueDist = dashDistancePx(rogueDash.speed, rogueDash.durationMs);
  if (
    warriorDash.style === 'dash' &&
    mageDash.style === 'blink' &&
    rogueDash.style === 'dash' &&
    warriorDist < mageDist &&
    mageDist < rogueDist &&
    rogueDash.cooldownMs < warriorDash.cooldownMs &&
    mageDash.cooldownMs > warriorDash.cooldownMs
  ) {
    pass('B-dash', `W ${warriorDist.toFixed(0)} blink ${mageDist.toFixed(0)} R ${rogueDist.toFixed(0)}`);
  } else {
    fail('B-dash', JSON.stringify({ warriorDist, mageDist, rogueDist, mageDash, rogueDash }));
  }

  const classes = [PLAYER_CLASS_ID.WARRIOR, PLAYER_CLASS_ID.MAGE, PLAYER_CLASS_ID.ROGUE] as const;
  const configs = classes.map((classId) => {
    const state = applyEvents(createInitialGameState(), [{ type: 'PLAYER_CLASS_UPDATED', classId }]);
    return buildCombatConfig(state, TEST_GOBLIN_COMBAT_ID);
  });
  const configOk = configs.every(
    (config, index) =>
      config?.player.classId === classes[index] &&
      config.player.maxHp === PLAYER_CLASSES[classes[index]].baseStats.maxHp &&
      config.player.moveSpeed === PLAYER_CLASSES[classes[index]].baseStats.moveSpeed
  );
  if (configOk) {
    pass('C-combat-config', configs.map((config) => config?.player.classId).join(' '));
  } else {
    fail('C-combat-config', JSON.stringify(configs.map((config) => config?.player)));
  }

  const allImplemented = Object.values(SKILLS).every((skill) => skill.implemented);
  const hudNames = {
    warrior: `${getSkillForSlot('warrior', 'Q')?.name}/${getSkillForSlot('warrior', 'E')?.name}`,
    mage: `${getSkillForSlot('mage', 'Q')?.name}/${getSkillForSlot('mage', 'E')?.name}`,
    rogue: `${getSkillForSlot('rogue', 'Q')?.name}/${getSkillForSlot('rogue', 'E')?.name}`,
  };
  if (allImplemented && hudNames.warrior === '돌진 베기/방어' && hudNames.mage === '화염탄/냉기 폭발' && hudNames.rogue === '그림자 질주/급소 찌르기') {
    pass('D-hud-skills', `${hudNames.warrior} | ${hudNames.mage} | ${hudNames.rogue}`);
  } else {
    fail('D-hud-skills', JSON.stringify({ allImplemented, hudNames }));
  }

  const warriorCalls: string[] = [];
  const warrior = new SkillController({
    classId: PLAYER_CLASS_ID.WARRIOR,
    vitals: createVitals(60),
    aim: { playerX: () => 0, playerY: () => 0, pointerX: () => 80, pointerY: () => 0 },
    executors: createSkillExecutors({
      spawnFireball: () => warriorCalls.push('fireball'),
      chargeSlash: () => warriorCalls.push('charge'),
      guard: () => warriorCalls.push('guard'),
    }),
  });
  const q = warrior.tryUse('Q');
  const e = warrior.tryUse('E');
  const qAgain = warrior.tryUse('Q');
  if (q.ok && e.ok && qAgain.ok === false && qAgain.reason === 'COOLDOWN' && warriorCalls.join(',') === 'charge,guard') {
    pass('E-warrior-skills', `Q ${SKILLS.warrior_charge_slash.damage} E guard`);
  } else {
    fail('E-warrior-skills', JSON.stringify({ q, e, qAgain, warriorCalls }));
  }

  const reduced = applyDamageReduction(20, 0.7);
  if (reduced === 6) {
    pass('F-guard', `20 * 30% = ${reduced}`);
  } else {
    fail('F-guard', String(reduced));
  }

  const mageCalls: string[] = [];
  const mage = new SkillController({
    classId: PLAYER_CLASS_ID.MAGE,
    vitals: createVitals(150),
    aim: { playerX: () => 0, playerY: () => 0, pointerX: () => 120, pointerY: () => 0 },
    executors: createSkillExecutors({
      spawnFireball: () => mageCalls.push('fireball'),
      frostNova: () => mageCalls.push('nova'),
    }),
  });
  const fireball = mage.tryUse('Q');
  const nova = mage.tryUse('E');
  const novaIn = inRadius({ x: 0, y: 0 }, { x: 80, y: 0 }, SKILLS.mage_frost_nova.range ?? 0);
  const novaOut = inRadius({ x: 0, y: 0 }, { x: 200, y: 0 }, SKILLS.mage_frost_nova.range ?? 0);
  const slowTick = tickTimedModifier(1500, 1500);
  if (
    fireball.ok &&
    nova.ok &&
    mageCalls.join(',') === 'fireball,nova' &&
    SKILLS.mage_fireball.damage === 35 &&
    novaIn &&
    !novaOut &&
    !slowTick.active
  ) {
    pass('G-mage-skills', `fireball ${SKILLS.mage_fireball.damage} nova radius ${SKILLS.mage_frost_nova.range}`);
  } else {
    fail('G-mage-skills', JSON.stringify({ fireball, nova, mageCalls, novaIn, novaOut, slowTick }));
  }

  const behind = isBackAttack({ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 1, y: 0 });
  const front = isBackAttack({ x: 80, y: 0 }, { x: 40, y: 0 }, { x: 1, y: 0 });
  const backDmg = backstabDamage(35, 60, true);
  const frontDmg = backstabDamage(35, 60, false);
  const rogueCalls: string[] = [];
  const rogue = new SkillController({
    classId: PLAYER_CLASS_ID.ROGUE,
    vitals: createVitals(90),
    aim: { playerX: () => 0, playerY: () => 0, pointerX: () => 100, pointerY: () => 0 },
    executors: createSkillExecutors({
      spawnFireball: () => rogueCalls.push('fireball'),
      shadowDash: () => rogueCalls.push('shadow'),
      backstab: () => rogueCalls.push('backstab'),
    }),
  });
  const shadow = rogue.tryUse('Q');
  const backstab = rogue.tryUse('E');
  if (
    behind &&
    !front &&
    backDmg === 60 &&
    frontDmg === 35 &&
    shadow.ok &&
    backstab.ok &&
    rogueCalls.join(',') === 'shadow,backstab'
  ) {
    pass('H-rogue-skills', `back ${backDmg} front ${frontDmg}`);
  } else {
    fail('H-rogue-skills', JSON.stringify({ behind, front, backDmg, frontDmg, shadow, backstab, rogueCalls }));
  }

  const appearance = {
    warrior: getClassAppearance('warrior'),
    mage: getClassAppearance('mage'),
    rogue: getClassAppearance('rogue'),
  };
  if (appearance.warrior.label === 'WARRIOR' && appearance.mage.shape === 'circle' && appearance.rogue.size < appearance.warrior.size) {
    pass('I-appearance', `${appearance.warrior.label}/${appearance.mage.label}/${appearance.rogue.label}`);
  } else {
    fail('I-appearance', JSON.stringify(appearance));
  }

  const mpFail = new SkillController({
    classId: PLAYER_CLASS_ID.MAGE,
    vitals: createVitals(10),
    aim: { playerX: () => 0, playerY: () => 0, pointerX: () => 10, pointerY: () => 0 },
    executors: createSkillExecutors({ spawnFireball: () => undefined, frostNova: () => undefined }),
  });
  const lowMp = mpFail.tryUse('E');
  if (lowMp.ok === false && lowMp.reason === 'MP' && DASH_PROFILES.warrior_dash.id === 'warrior_dash') {
    pass('J-mp-block', 'frost nova blocked at 10 MP');
  } else {
    fail('J-mp-block', JSON.stringify(lowMp));
  }

  return lines;
}
