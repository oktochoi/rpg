import type { BossDebugSnapshot } from './boss-types';

export function formatBossDebug(debug: BossDebugSnapshot): string {
  return [
    `BOSS HP ${debug.hp}/${debug.maxHp}`,
    `PHASE ${debug.phase}`,
    `STATE ${debug.state}`,
    `PATTERN ${debug.patternId ?? '-'}`,
    `NEXT ${debug.nextPatternId ?? '-'}`,
    `CD ${debug.cooldownMs}ms`,
  ].join('\n');
}
