import { AI_TIMEOUT_MS, createAiRequestId, isBrowserRealAiEnabled, type AIRole } from '../config/ai-config';
import { recordAiDebug } from '../debug/ai-debug';
import type { AiRouteRequest, AiRouteResponse, AiTaskPayload } from '../payloads';

export interface AiTransport {
  request<T>(role: AIRole, turnId: number, payload: AiTaskPayload, requestId?: string): Promise<AiRouteResponse<T>>;
}

const inflight = new Map<string, Promise<AiRouteResponse>>();

export function createHttpAiTransport(fetchImpl: typeof fetch = fetch): AiTransport {
  return {
    async request<T>(role: AIRole, turnId: number, payload: AiTaskPayload, requestId = createAiRequestId(role, turnId)) {
      const key = `${role}:${turnId}`;
      const existing = inflight.get(key);
      if (existing) {
        return existing as Promise<AiRouteResponse<T>>;
      }
      const pending = postAiRequest<T>(fetchImpl, { type: role, turnId, requestId, payload });
      inflight.set(key, pending as Promise<AiRouteResponse>);
      try {
        return await pending;
      } finally {
        inflight.delete(key);
      }
    },
  };
}

export function createDirectAiTransport(
  handler: (request: AiRouteRequest) => Promise<AiRouteResponse>
): AiTransport {
  return {
    async request<T>(role: AIRole, turnId: number, payload: AiTaskPayload, requestId = createAiRequestId(role, turnId)) {
      return (await handler({ type: role, turnId, requestId, payload })) as AiRouteResponse<T>;
    },
  };
}

async function postAiRequest<T>(fetchImpl: typeof fetch, body: AiRouteRequest): Promise<AiRouteResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS + 1000);
  try {
    const response = await fetchImpl('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await response.json()) as AiRouteResponse<T>;
    recordAiDebug({
      lastRequestType: body.type,
      requestId: json.requestId ?? body.requestId,
      turnId: json.turnId ?? body.turnId,
      latencyMs: json.latencyMs ?? null,
      success: json.success,
      fallbackUsed: Boolean(json.fallbackUsed),
      schemaValid: json.success,
      error: json.error,
      provider: json.provider,
      model: json.model,
    });
    return json;
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network';
    recordAiDebug({
      lastRequestType: body.type,
      requestId: body.requestId,
      turnId: body.turnId,
      success: false,
      fallbackUsed: true,
      schemaValid: false,
      error: message,
      provider: 'http',
    });
    return {
      success: false,
      error: message,
      provider: 'http',
      fallbackUsed: true,
      turnId: body.turnId,
      requestId: body.requestId,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function shouldUseRealAiClient(): boolean {
  return isBrowserRealAiEnabled();
}

let sharedTransport: AiTransport | null = null;

export function getSharedAiTransport(): AiTransport {
  if (!sharedTransport) {
    sharedTransport = createHttpAiTransport();
  }
  return sharedTransport;
}

export function setSharedAiTransport(transport: AiTransport | null): void {
  sharedTransport = transport;
}
