import type { z } from 'zod';
import type { AIRole } from '../config/ai-config';

export interface AIRequest<T = unknown> {
  role: AIRole;
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  timeoutMs: number;
  temperature: number;
  requestId: string;
  turnId: number;
  schema?: z.ZodType<T>;
}

export interface AIResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  latencyMs?: number;
  fallbackUsed?: boolean;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

export interface AIProvider {
  generateStructured<T>(request: AIRequest<T>): Promise<AIResult<T>>;
}
