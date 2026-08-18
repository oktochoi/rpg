import { EventBus } from '../EventBus';
import { startCombatGame } from './CombatGame';
import { buildCombatConfig, playerCombatSnapshot } from './build-combat-config';
import type { CombatConfig } from './types/combat-config';
import { COMBAT_RESULT_EVENT, type CombatResult } from './types/combat-result';

export { COMBAT_RESULT_EVENT, buildCombatConfig, playerCombatSnapshot };

export function startBridgedCombat(parent: string, config: CombatConfig): Phaser.Game {
  return startCombatGame(parent, config);
}

export function publishCombatResult(result: CombatResult): void {
  EventBus.emit(COMBAT_RESULT_EVENT, result);
}

export function subscribeCombatResult(handler: (result: CombatResult) => void): () => void {
  EventBus.on(COMBAT_RESULT_EVENT, handler);
  return () => {
    EventBus.off(COMBAT_RESULT_EVENT, handler);
  };
}
