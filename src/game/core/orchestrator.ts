import type { Command } from './command';
import type { GameState } from './game-state';

/**
 * Accepts Commands, runs them through the Rules Engine, and applies Events.
 * React and AI must not mutate GameState themselves.
 */
export interface GameOrchestrator {
  dispatch(command: Command): void;
  getState(): Readonly<GameState>;
}
