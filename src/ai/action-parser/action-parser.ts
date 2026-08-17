export interface ParsedAction {
  rawInput: string;
  intent: string;
}

/**
 * Interprets the player's free-text input (choice 4).
 * Must not modify GameState; output is a proposal only.
 */
export interface ActionParser {
  parse(rawInput: string): ParsedAction;
}
