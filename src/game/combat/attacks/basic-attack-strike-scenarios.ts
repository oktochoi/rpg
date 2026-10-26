import {
  BASIC_CRIT_CHANCE,
  BASIC_CRIT_MULTIPLIER,
  basicAttackDamageLabel,
  damageNumberForStrike,
  rollBasicAttackStrike,
} from './basic-attack-strike';

export function runBasicAttackStrikeScenarios(): string[] {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const highAttack = 80;
  const rolls = Array.from({ length: 30 }, (_, index) => (index === 4 || index === 17 || index === 28 ? 0.01 : 0.4));
  const strikes = rolls.map((roll) => rollBasicAttackStrike(highAttack, roll));
  const crits = strikes.filter((strike) => strike.critical);
  const normals = strikes.filter((strike) => !strike.critical);
  const expectedCrit = Math.max(1, Math.round(highAttack * BASIC_CRIT_MULTIPLIER));

  if (strikes.length === 30 && crits.length === 3 && normals.length === 27) {
    pass('30-mix', `normal ${normals.length}, critical ${crits.length}`);
  } else {
    fail('30-mix', `normal ${normals.length}, critical ${crits.length}`);
  }

  if (normals.every((strike) => strike.damage === highAttack) && crits.every((strike) => strike.damage === expectedCrit)) {
    pass('30-amounts', `normal ${highAttack}, critical ${expectedCrit}`);
  } else {
    fail('30-amounts', strikes.map((strike) => strike.damage).join(','));
  }

  const labels = strikes.map((strike) => basicAttackDamageLabel(strike.damage, strike.critical));
  const critLabels = labels.filter((label) => label.startsWith('CRITICAL'));
  const plainLabels = labels.filter((label) => !label.startsWith('CRITICAL'));
  if (
    critLabels.length === 3 &&
    plainLabels.length === 27 &&
    plainLabels.every((label) => label === `${highAttack}`) &&
    critLabels.every((label) => label === `CRITICAL ${expectedCrit}`)
  ) {
    pass('30-labels', 'high damage stays a normal number unless that swing crit');
  } else {
    fail('30-labels', labels.join(' | '));
  }

  const critThenNormal = [rollBasicAttackStrike(22, 0), rollBasicAttackStrike(22, 0.9)];
  if (critThenNormal[0].critical && !critThenNormal[1].critical && critThenNormal[1].damage === 22) {
    pass('no-sticky-crit', 'previous crit does not mark the next swing');
  } else {
    fail('no-sticky-crit', JSON.stringify(critThenNormal));
  }

  const low = rollBasicAttackStrike(22, 0.06);
  const raised = rollBasicAttackStrike(200, 0.06);
  if (!low.critical && !raised.critical && low.damage === 22 && raised.damage === 200 && BASIC_CRIT_CHANCE === 0.05) {
    pass('attack-power-separate', 'same roll above 5% is normal at 22 and at 200');
  } else {
    fail('attack-power-separate', JSON.stringify({ low, raised }));
  }

  const bossShown = damageNumberForStrike(2000, 1962, 51);
  if (bossShown === 38 && basicAttackDamageLabel(bossShown, true) === 'CRITICAL 38') {
    pass('shown-equals-dealt', 'label uses the HP actually removed');
  } else {
    fail('shown-equals-dealt', String(bossShown));
  }

  return lines;
}
