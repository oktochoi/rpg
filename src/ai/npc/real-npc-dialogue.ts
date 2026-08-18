import { containsLeakedSecret } from '../../game/story/choices/choice-templates';
import type { NpcId } from '../../game/core/ids';
import type { NpcDialogueContext } from '../../game/npc/dialogue-context';
import type { NpcDialogueResponse, NpcDialogueService } from '../types';
import { getSharedAiTransport, type AiTransport } from '../client/ai-transport';
import { buildNpcAiPayload } from '../context/npc-ai-payload';
import { recordAiDebug } from '../debug/ai-debug';
import { parseNpcDialogueResponse, sanitizeNpcDialogueResponse } from '../schemas/npc-dialogue-schema';

export interface RealNpcDialogueOptions {
  readContext: (npcId: NpcId, playerInput: string) => NpcDialogueContext | null;
  getTurnId: () => number;
  fallback: NpcDialogueService;
  transport?: AiTransport;
}

export function createRealNpcDialogueService(options: RealNpcDialogueOptions): NpcDialogueService {
  const transport = options.transport ?? getSharedAiTransport();
  return {
    async respond(npcId: NpcId, playerInput: string): Promise<NpcDialogueResponse> {
      const context = options.readContext(npcId, playerInput);
      if (!context) {
        return options.fallback.respond(npcId, playerInput);
      }
      const turnId = options.getTurnId();
      try {
        const payload = buildNpcAiPayload(context);
        const result = await transport.request('npc', turnId, payload);
        if (options.getTurnId() !== turnId) {
          recordAiDebug({ success: false, fallbackUsed: true, error: 'stale_turn', turnId });
          return options.fallback.respond(npcId, playerInput);
        }
        const parsed = parseNpcDialogueResponse(result.data);
        if (!result.success || !parsed || containsLeakedSecret(parsed.dialogue)) {
          recordAiDebug({
            lastRequestType: 'npc',
            success: false,
            fallbackUsed: true,
            schemaValid: Boolean(parsed),
            error: result.error ?? 'schema_failed',
            latencyMs: result.latencyMs ?? null,
            provider: result.provider,
          });
          return options.fallback.respond(npcId, playerInput);
        }
        const sanitized = sanitizeNpcDialogueResponse(
          parsed,
          new Set(context.knownFacts.map((fact) => fact.id)),
          new Set(context.relevantMemories.map((memory) => memory.id)),
          context.npc.id
        );
        recordAiDebug({
          lastRequestType: 'npc',
          success: true,
          fallbackUsed: false,
          schemaValid: true,
          latencyMs: result.latencyMs ?? null,
          provider: result.provider,
          requestId: result.requestId,
          turnId,
        });
        return sanitized;
      } catch {
        recordAiDebug({ lastRequestType: 'npc', success: false, fallbackUsed: true, error: 'npc_error', turnId });
        return options.fallback.respond(npcId, playerInput);
      }
    },
  };
}
