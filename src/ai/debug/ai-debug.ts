import type { AIRole, AIMode } from '../config/ai-config';

export interface AiDebugSnapshot {
  mode: AIMode;
  provider: string;
  model: string;
  lastRequestType: AIRole | null;
  requestId: string | null;
  turnId: number | null;
  latencyMs: number | null;
  success: boolean | null;
  fallbackUsed: boolean;
  schemaValid: boolean | null;
  error?: string;
}

const EMPTY: AiDebugSnapshot = {
  mode: 'mock',
  provider: 'mock',
  model: 'none',
  lastRequestType: null,
  requestId: null,
  turnId: null,
  latencyMs: null,
  success: null,
  fallbackUsed: false,
  schemaValid: null,
};

let lastDebug: AiDebugSnapshot = { ...EMPTY };

export function getLastAiDebug(): AiDebugSnapshot {
  return lastDebug;
}

export function recordAiDebug(partial: Partial<AiDebugSnapshot>): void {
  lastDebug = {
    ...lastDebug,
    ...partial,
    error: sanitizeDebugError(partial.error ?? lastDebug.error),
  };
}

export function resetAiDebug(): void {
  lastDebug = { ...EMPTY };
}

function sanitizeDebugError(error: string | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return error.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/sk-[A-Za-z0-9._-]+/g, '[redacted]');
}
