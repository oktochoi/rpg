import type { AIProvider, AIRequest, AIResult } from './ai-provider';

export interface MockAiProviderOptions {
  failWith?: string;
  delayMs?: number;
  data?: unknown;
  invalidJson?: boolean;
}

export function createMockAiProvider(options: MockAiProviderOptions = {}): AIProvider {
  return {
    async generateStructured<T>(request: AIRequest<T>): Promise<AIResult<T>> {
      if (options.delayMs && options.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.delayMs));
      }
      if (options.failWith) {
        return {
          success: false,
          error: options.failWith,
          provider: 'mock',
          fallbackUsed: true,
        };
      }
      if (options.invalidJson) {
        return {
          success: false,
          error: 'invalid_json',
          provider: 'mock',
          fallbackUsed: true,
        };
      }
      if (options.data !== undefined) {
        if (request.schema) {
          const parsed = request.schema.safeParse(options.data);
          if (!parsed.success) {
            return { success: false, error: 'schema_failed', provider: 'mock', fallbackUsed: true };
          }
          return { success: true, data: parsed.data, provider: 'mock' };
        }
        return { success: true, data: options.data as T, provider: 'mock' };
      }
      return {
        success: false,
        error: 'mock_provider_no_llm',
        provider: 'mock',
        fallbackUsed: true,
      };
    },
  };
}
