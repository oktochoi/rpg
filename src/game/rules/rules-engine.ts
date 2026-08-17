import type { Command } from '../core/command';
import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';

export interface RuleResult {
  allowed: boolean;
  events: readonly GameEvent[];
  reason?: string;
}

/**
 * Judges whether a Command is actually possible.
 * Produces Events; does not mutate GameState by itself.
 */
export interface RulesEngine {
  evaluate(command: Command, state: Readonly<GameState>): RuleResult;
}
