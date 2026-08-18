import type { ActionParserContext } from '../../game/actions/parser-context';
import type { ParsedAction } from '../../game/actions/action-types';
import type { ActionParser } from './types';
import { allowedParserTargetIds, buildActionParserAiPayload } from '../context/action-parser-payload';
import { getSharedAiTransport, type AiTransport } from '../client/ai-transport';
import { recordAiDebug } from '../debug/ai-debug';
import { constrainParsedAction, parseParsedAction } from '../schemas/parsed-action-schema';

export interface RealActionParserOptions {
  fallback: ActionParser;
  transport?: AiTransport;
  getTurnId?: () => number;
}

export function createRealActionParser(options: RealActionParserOptions): ActionParser {
  const transport = options.transport ?? getSharedAiTransport();
  return {
    async parse(input: string, context: ActionParserContext): Promise<ParsedAction> {
      const turnId = options.getTurnId?.() ?? 0;
      try {
        const payload = buildActionParserAiPayload(input, context);
        const result = await transport.request('action', turnId, payload);
        if (options.getTurnId && options.getTurnId() !== turnId) {
          recordAiDebug({ lastRequestType: 'action', success: false, fallbackUsed: true, error: 'stale_turn', turnId });
          return options.fallback.parse(input, context);
        }
        const parsed = parseParsedAction(result.data);
        if (!result.success || !parsed) {
          recordAiDebug({
            lastRequestType: 'action',
            success: false,
            fallbackUsed: true,
            schemaValid: false,
            error: result.error ?? 'schema_failed',
            latencyMs: result.latencyMs ?? null,
            provider: result.provider,
          });
          return options.fallback.parse(input, context);
        }
        const constrained = constrainParsedAction(parsed, allowedParserTargetIds(payload));
        recordAiDebug({
          lastRequestType: 'action',
          success: true,
          fallbackUsed: false,
          schemaValid: true,
          latencyMs: result.latencyMs ?? null,
          provider: result.provider,
          requestId: result.requestId,
          turnId,
        });
        return { ...constrained, rawInput: input };
      } catch {
        recordAiDebug({ lastRequestType: 'action', success: false, fallbackUsed: true, error: 'parser_error', turnId });
        return options.fallback.parse(input, context);
      }
    },
  };
}
