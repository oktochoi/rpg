import { NPCDialogueResponseSchema } from '../schemas/npc-dialogue-schema';
import { ParsedActionSchema } from '../schemas/parsed-action-schema';
import { DirectorLlmResponseSchema } from '../director/director-llm-schema';
import type { z } from 'zod';
import {
  isServerRealAiConfigured,
  publicAiStatus,
  readServerAiConfig,
  type AIRole,
  type ServerAiConfig,
} from '../config/ai-config';
import { recordAiDebug } from '../debug/ai-debug';
import type { AIProvider } from '../provider/ai-provider';
import { createOpenAiCompatibleProvider } from '../provider/real-ai-provider';
import { actionParserSystemPrompt, actionParserUserPrompt } from '../prompts/action-parser-prompt';
import { directorSystemPrompt, directorUserPrompt } from '../prompts/director-prompt';
import { npcSystemPrompt, npcUserPrompt } from '../prompts/npc-prompt';
import type {
  ActionParserAiPayload,
  AiRouteResponse,
  DirectorAiPayload,
  NpcAiPayload,
} from '../payloads';
import { parseAiRouteRequest } from '../payloads';

const MAX_PAYLOAD_CHARS = 20_000;

export interface HandleAiDeps {
  provider?: AIProvider;
  config?: ServerAiConfig;
}

export function handleAiStatus(): ReturnType<typeof publicAiStatus> {
  return publicAiStatus();
}

export async function handleAiRequest(body: unknown, deps: HandleAiDeps = {}): Promise<AiRouteResponse> {
  const request = parseAiRouteRequest(body);
  if (!request) {
    return failResponse('invalid_request', 'none', 0, 'invalid');
  }

  const payloadSize = JSON.stringify(request.payload).length;
  if (payloadSize > MAX_PAYLOAD_CHARS) {
    return failResponse('payload_too_large', 'none', request.turnId, request.requestId);
  }

  const config = deps.config ?? readServerAiConfig();
  if (!isServerRealAiConfigured(config)) {
    const result = failResponse('ai_disabled', config.provider, request.turnId, request.requestId, config.model);
    recordRouteDebug(request.type, result, false);
    return result;
  }

  const provider = deps.provider ?? createOpenAiCompatibleProvider(config);
  const prompts = promptsFor(request.type, request.payload);
  if (!prompts) {
    return failResponse('invalid_payload', config.provider, request.turnId, request.requestId, config.model);
  }

  const generated = await provider.generateStructured<unknown>({
    role: request.type,
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    schemaName: request.type,
    timeoutMs: config.timeoutMs,
    temperature: config.roles[request.type].temperature,
    requestId: request.requestId,
    turnId: request.turnId,
    schema: prompts.schema,
  });

  const result: AiRouteResponse = {
    success: generated.success,
    data: generated.data,
    error: generated.error,
    provider: generated.provider,
    model: config.model,
    latencyMs: generated.latencyMs,
    fallbackUsed: generated.fallbackUsed ?? !generated.success,
    turnId: request.turnId,
    requestId: request.requestId,
    usage: generated.usage,
  };
  recordRouteDebug(request.type, result, generated.success);
  return result;
}

function promptsFor(
  role: AIRole,
  payload: unknown
): { systemPrompt: string; userPrompt: string; schema: z.ZodType<unknown> } | null {
  if (role === 'npc') {
    const data = payload as NpcAiPayload;
    if (!data?.npc?.id || typeof data.playerSaid !== 'string') {
      return null;
    }
    return {
      systemPrompt: npcSystemPrompt(),
      userPrompt: npcUserPrompt(data),
      schema: NPCDialogueResponseSchema,
    };
  }
  if (role === 'action') {
    const data = payload as ActionParserAiPayload;
    if (!data || typeof data.rawInput !== 'string') {
      return null;
    }
    return {
      systemPrompt: actionParserSystemPrompt(),
      userPrompt: actionParserUserPrompt(data),
      schema: ParsedActionSchema,
    };
  }
  const data = payload as DirectorAiPayload;
  if (!data || !Array.isArray(data.candidates) || typeof data.turnId !== 'number') {
    return null;
  }
  return {
    systemPrompt: directorSystemPrompt(),
    userPrompt: directorUserPrompt(data),
    schema: DirectorLlmResponseSchema,
  };
}

function failResponse(
  error: string,
  provider: string,
  turnId: number,
  requestId: string,
  model?: string
): AiRouteResponse {
  return {
    success: false,
    error,
    provider,
    model,
    fallbackUsed: true,
    turnId,
    requestId,
  };
}

function recordRouteDebug(role: AIRole, result: AiRouteResponse, schemaValid: boolean): void {
  recordAiDebug({
    mode: result.fallbackUsed && !result.success ? 'mock' : 'real',
    provider: result.provider,
    model: result.model ?? 'unknown',
    lastRequestType: role,
    requestId: result.requestId,
    turnId: result.turnId,
    latencyMs: result.latencyMs ?? null,
    success: result.success,
    fallbackUsed: Boolean(result.fallbackUsed),
    schemaValid,
    error: result.error,
  });
}
