import { z } from 'zod';
import type { NpcDialogueResponse } from '../types';

export const NPC_EMOTIONS = ['NEUTRAL', 'FRIENDLY', 'SUSPICIOUS', 'ANGRY', 'AFRAID', 'CURIOUS'] as const;

export const NPCDialogueResponseSchema = z.object({
  npcId: z.string().min(1),
  dialogue: z.string().min(1),
  emotion: z.enum(NPC_EMOTIONS),
  usedFactIds: z.array(z.string()).default([]),
  usedMemoryIds: z.array(z.string()).default([]),
  referencedClaimIds: z.array(z.string()).optional(),
});

export function parseNpcDialogueResponse(value: unknown): NpcDialogueResponse | null {
  const parsed = NPCDialogueResponseSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export function sanitizeNpcDialogueResponse(
  value: NpcDialogueResponse,
  allowedFactIds: ReadonlySet<string>,
  allowedMemoryIds: ReadonlySet<string>,
  expectedNpcId: string
): NpcDialogueResponse {
  return {
    npcId: expectedNpcId,
    dialogue: clipNpcDialogue(value.dialogue),
    emotion: value.emotion,
    usedFactIds: value.usedFactIds.filter((id) => allowedFactIds.has(id)),
    usedMemoryIds: value.usedMemoryIds.filter((id) => allowedMemoryIds.has(id)),
    referencedClaimIds: value.referencedClaimIds?.filter((id) => id.length > 0),
  };
}

export function clipNpcDialogue(text: string, maxSentences = 4): string {
  const trimmed = text.trim();
  const parts = trimmed.split(/(?<=[.!?。])\s+/).filter((part) => part.length > 0);
  if (parts.length <= maxSentences) {
    return trimmed;
  }
  return parts.slice(0, maxSentences).join(' ');
}
