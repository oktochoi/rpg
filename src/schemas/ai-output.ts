/**
 * Shape for Zod validators. AI output must be parsed before use.
 * Implementations must not write GameState.
 */
export interface SchemaValidator<T> {
  parse(input: unknown): T;
}
