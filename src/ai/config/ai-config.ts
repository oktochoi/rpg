export const AI_ROLES = ['npc', 'action', 'director'] as const;
export type AIRole = (typeof AI_ROLES)[number];

export type AIMode = 'mock' | 'real';

export interface RoleAiConfig {
  temperature: number;
}

export interface ServerAiConfig {
  mode: AIMode;
  provider: 'openai-compatible';
  model: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
  roles: Record<AIRole, RoleAiConfig>;
}

export const AI_TIMEOUT_MS = 12_000;
export const AI_MAX_RETRIES = 1;
export const AI_DIALOGUE_HISTORY_LIMIT = 8;

const ROLE_TEMPERATURE: Record<AIRole, number> = {
  action: 0.1,
  director: 0.3,
  npc: 0.55,
};

function firstPrivateEnv(...keys: string[]): string {
  for (const key of keys) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      continue;
    }
    const value = (process.env[key] ?? '').trim();
    if (value) {
      return value;
    }
  }
  return '';
}

export function readPublicAiMode(): AIMode {
  return process.env.NEXT_PUBLIC_AI_MODE === 'real' ? 'real' : 'mock';
}

export function isClientRealAiEnabled(): boolean {
  return readPublicAiMode() === 'real';
}

export function isBrowserRealAiEnabled(): boolean {
  return typeof window !== 'undefined' && isClientRealAiEnabled();
}

export function readServerAiConfig(): ServerAiConfig {
  const apiKey = firstPrivateEnv('GROQ_API_KEY', 'LLM_API_KEY');
  const requested: AIMode = process.env.AI_MODE === 'real' || process.env.NEXT_PUBLIC_AI_MODE === 'real' ? 'real' : 'mock';
  const mode: AIMode = requested === 'real' && apiKey.length > 0 ? 'real' : 'mock';
  return {
    mode,
    provider: 'openai-compatible',
    model: firstPrivateEnv('GROQ_MODEL', 'LLM_MODEL') || 'llama-3.1-8b-instant',
    baseUrl: (process.env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
    apiKey,
    timeoutMs: Number(firstPrivateEnv('GROQ_TIMEOUT_MS', 'LLM_TIMEOUT_MS') || AI_TIMEOUT_MS) || AI_TIMEOUT_MS,
    maxRetries: AI_MAX_RETRIES,
    roles: {
      action: { temperature: ROLE_TEMPERATURE.action },
      director: { temperature: ROLE_TEMPERATURE.director },
      npc: { temperature: ROLE_TEMPERATURE.npc },
    },
  };
}

export function isServerRealAiConfigured(config: ServerAiConfig = readServerAiConfig()): boolean {
  return config.mode === 'real' && config.apiKey.length > 0;
}

export function createAiRequestId(role: AIRole, turnId: number): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `ai_${role}_turn${turnId}_${suffix}`;
}

export function publicAiStatus(config: ServerAiConfig = readServerAiConfig()): {
  mode: AIMode;
  provider: string;
  model: string;
  configured: boolean;
} {
  return {
    mode: config.mode,
    provider: config.provider,
    model: config.model,
    configured: isServerRealAiConfigured(config),
  };
}
