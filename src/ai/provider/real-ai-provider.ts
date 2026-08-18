import type { ServerAiConfig } from '../config/ai-config';
import type { AIProvider, AIRequest, AIResult } from './ai-provider';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string; type?: string };
}

export function createOpenAiCompatibleProvider(config: ServerAiConfig, fetchImpl: typeof fetch = fetch): AIProvider {
  return {
    async generateStructured<T>(request: AIRequest<T>): Promise<AIResult<T>> {
      const started = Date.now();
      const attempts = config.maxRetries + 1;
      let lastError = 'provider_error';

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const result = await callOnce<T>(config, request, fetchImpl);
          return { ...result, latencyMs: Date.now() - started };
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'provider_error';
          const retryable = lastError === 'timeout' || lastError === 'rate_limit' || lastError === 'network';
          if (!retryable || attempt >= attempts - 1) {
            break;
          }
        }
      }

      return {
        success: false,
        error: lastError,
        provider: config.provider,
        latencyMs: Date.now() - started,
        fallbackUsed: true,
      };
    },
  };
}

async function callOnce<T>(
  config: ServerAiConfig,
  request: AIRequest<T>,
  fetchImpl: typeof fetch
): Promise<AIResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs);
  try {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: request.temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new Error('rate_limit');
    }
    if (!response.ok) {
      throw new Error(response.status >= 500 ? 'network' : 'provider_error');
    }

    const body = (await response.json()) as ChatCompletionResponse;
    if (body.error?.message) {
      throw new Error('provider_error');
    }
    const content = body.choices?.[0]?.message?.content;
    const json = parseJsonObject(content);
    if (!json) {
      return { success: false, error: 'invalid_json', provider: config.provider, fallbackUsed: true };
    }
    if (request.schema) {
      const parsed = request.schema.safeParse(json);
      if (!parsed.success) {
        return { success: false, error: 'schema_failed', provider: config.provider, fallbackUsed: true };
      }
      return {
        success: true,
        data: parsed.data,
        provider: config.provider,
        usage: usageFrom(body),
      };
    }
    return { success: true, data: json as T, provider: config.provider, usage: usageFrom(body) };
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message === 'timeout')) {
      throw new Error('timeout');
    }
    if (error instanceof Error && (error.message === 'rate_limit' || error.message === 'network')) {
      throw error;
    }
    throw new Error('network');
  } finally {
    clearTimeout(timer);
  }
}

function usageFrom(body: ChatCompletionResponse): AIResult['usage'] {
  if (!body.usage) {
    return undefined;
  }
  return {
    promptTokens: body.usage.prompt_tokens,
    completionTokens: body.usage.completion_tokens,
    totalTokens: body.usage.total_tokens,
  };
}

export function parseJsonObject(content: string | null | undefined): unknown {
  if (!content) {
    return null;
  }
  const trimmed = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
