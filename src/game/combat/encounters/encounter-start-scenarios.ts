import { ENCOUNTER_ID } from './encounter-definitions';
import { ENEMY_TYPE_ID } from '../enemies/enemy-types';
import {
  encounterEntranceSide,
  encounterStartBudgetMs,
  openingAttackDelayMs,
  planEncounterStart,
  planEnemyEntrance,
  type EncounterStartPlan,
} from './encounter-intro';

const BOUNDS = { width: 1000, height: 640, originX: 40, originY: 80 };

function pass(name: string, detail: string): string {
  return `PASS ${name}: ${detail}`;
}

function fail(name: string, detail: string): string {
  return `FAIL ${name}: ${detail}`;
}

function budgetOk(plan: EncounterStartPlan, min: number, max: number): boolean {
  const total = encounterStartBudgetMs(plan);
  return total >= min && total <= max;
}

export function runEncounterStartScenarios(): string[] {
  const lines: string[] = [];
  const forest = planEncounterStart({
    encounterId: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
    training: false,
    repeat: false,
    observed: false,
    boss: false,
  });
  const forestRepeat = planEncounterStart({
    encounterId: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
    training: false,
    repeat: true,
    observed: false,
    boss: false,
  });
  const camp = planEncounterStart({
    encounterId: ENCOUNTER_ID.CH1_GOBLIN_CAMP,
    training: false,
    repeat: false,
    observed: true,
    boss: false,
  });
  const ruins = planEncounterStart({
    encounterId: ENCOUNTER_ID.RUINS_MIXED_01,
    training: false,
    repeat: false,
    observed: false,
    boss: false,
  });
  const guardian = planEncounterStart({
    encounterId: ENCOUNTER_ID.RUINS_BOSS_01,
    training: false,
    repeat: false,
    observed: false,
    boss: true,
  });
  const training = planEncounterStart({
    encounterId: ENCOUNTER_ID.TRAINING_GROUNDS,
    training: true,
    repeat: true,
    observed: false,
    boss: false,
  });

  if (
    forest.phases[0] === 'pre' &&
    forest.cue.includes('금속') &&
    forest.meet.includes('정찰대') &&
    forest.walkIn &&
    forest.preMs >= 500 &&
    forest.preMs <= 700 &&
    forest.graceMs >= 500 &&
    forest.graceMs <= 900 &&
    budgetOk(forest, 1800, 2600) &&
    encounterEntranceSide(ENCOUNTER_ID.CH1_FOREST_SCOUTS) === 'right'
  ) {
    lines.push(pass('start-forest', `${encounterStartBudgetMs(forest)}ms cue`));
  } else {
    lines.push(fail('start-forest', JSON.stringify(forest)));
  }

  if (forestRepeat.phases[0] === 'entrance' && !forestRepeat.cue && forestRepeat.meet.includes('정찰대') && budgetOk(forestRepeat, 500, 700)) {
    lines.push(pass('start-forest-repeat', `${encounterStartBudgetMs(forestRepeat)}ms`));
  } else {
    lines.push(fail('start-forest-repeat', JSON.stringify(forestRepeat)));
  }

  if (camp.cue.length > 0 && camp.meet.includes('야영지') && !camp.walkIn && camp.playEnemyEntrances && budgetOk(camp, 800, 1200)) {
    lines.push(pass('start-camp', 'observed, no walk-in'));
  } else {
    lines.push(fail('start-camp', JSON.stringify(camp)));
  }

  if (ruins.cue.length > 0 && ruins.meet.includes('폐허') && ruins.walkIn && budgetOk(ruins, 800, 1200)) {
    lines.push(pass('start-ruins', ruins.cue));
  } else {
    lines.push(fail('start-ruins', JSON.stringify(ruins)));
  }

  if (
    guardian.boss &&
    guardian.cue.includes('룬') &&
    guardian.meet.includes('고대 수호자') &&
    guardian.phases.includes('entrance') &&
    budgetOk(guardian, 1500, 2000)
  ) {
    lines.push(pass('start-guardian', `${encounterStartBudgetMs(guardian)}ms`));
  } else {
    lines.push(fail('start-guardian', JSON.stringify(guardian)));
  }

  if (!training.playEnemyEntrances && !training.walkIn && training.readyMs <= 100 && training.cue === '') {
    lines.push(pass('start-training', `${training.readyMs}ms`));
  } else {
    lines.push(fail('start-training', JSON.stringify(training)));
  }

  const goblin = planEnemyEntrance(ENEMY_TYPE_ID.GOBLIN, 400, 400, BOUNDS, 0, 'full', 'right');
  const wolf = planEnemyEntrance(ENEMY_TYPE_ID.DIRE_WOLF, 400, 400, BOUNDS, 0, 'full', 'left');
  const archer = planEnemyEntrance(ENEMY_TYPE_ID.ARCHER, 500, 300, BOUNDS, 0, 'full', 'alternate');
  const mage = planEnemyEntrance(ENEMY_TYPE_ID.GOBLIN_MAGE, 500, 300, BOUNDS, 0, 'full', 'alternate');
  const brute = planEnemyEntrance(ENEMY_TYPE_ID.BRUTE, 500, 360, BOUNDS, 0, 'full', 'alternate');
  const dummy = planEnemyEntrance(ENEMY_TYPE_ID.TRAINING_DUMMY, 500, 360, BOUNDS, 0, 'full', 'alternate');
  const distinct =
    goblin.style === 'run_in' &&
    goblin.fromX > BOUNDS.originX + BOUNDS.width &&
    wolf.style === 'run_in' &&
    wolf.fromX < BOUNDS.originX &&
    wolf.durationMs < goblin.durationMs &&
    archer.style === 'drop_back' &&
    archer.fromY < 300 &&
    mage.style === 'materialize' &&
    brute.style === 'awaken' &&
    dummy.style === 'stand' &&
    dummy.durationMs === 0;
  if (distinct) {
    lines.push(pass('entrance-kinds', `${goblin.style}/${archer.style}/${mage.style}/${wolf.style}/${brute.style}`));
  } else {
    lines.push(fail('entrance-kinds', JSON.stringify({ goblin, wolf, archer, mage, brute, dummy })));
  }

  const melee = openingAttackDelayMs({
    encounterId: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
    repeat: false,
    training: false,
    boss: false,
    index: 0,
    ranged: false,
  });
  const second = openingAttackDelayMs({
    encounterId: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
    repeat: false,
    training: false,
    boss: false,
    index: 1,
    ranged: false,
  });
  const archerDelay = openingAttackDelayMs({
    encounterId: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
    repeat: false,
    training: false,
    boss: false,
    index: 2,
    ranged: true,
  });
  const bossDelay = openingAttackDelayMs({
    encounterId: ENCOUNTER_ID.RUINS_BOSS_01,
    repeat: false,
    training: false,
    boss: true,
    index: 0,
    ranged: false,
  });
  const firstDamageMs = encounterStartBudgetMs(forest) + melee + 420;
  if (
    melee >= 700 &&
    second - melee >= 400 &&
    archerDelay - second >= 800 &&
    bossDelay === 0 &&
    firstDamageMs >= 2800 &&
    forest.preMs + forest.entranceMs >= 1000
  ) {
    lines.push(pass('scout-opening', `control ${forest.preMs + forest.entranceMs}ms first hit ~${firstDamageMs}ms`));
  } else {
    lines.push(fail('scout-opening', JSON.stringify({ melee, second, archerDelay, bossDelay, firstDamageMs })));
  }

  return lines;
}
