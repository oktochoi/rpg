import type { NpcId } from '../game/core/ids';
import { buildNpcDialogueContext } from '../game/npc/build-dialogue-context';
import type { GameState } from '../game/core/game-state';
import { shouldUseRealAiClient, type AiTransport } from './client/ai-transport';
import { createMockNpcDialogueService } from './mock/mockNpcDialogue';
import { createRealNpcDialogueService } from './npc/real-npc-dialogue';
import type { NpcDialogueService } from './types';

export type { NpcDialogueIntent, NpcDialogueResponse, NpcDialogueService, NpcEmotion } from './types';
export { createMockNpcDialogueService } from './mock/mockNpcDialogue';
export { createRealNpcDialogueService } from './npc/real-npc-dialogue';

export function createNpcDialogueService(
  getState: () => Readonly<GameState>,
  options?: { transport?: AiTransport; forceReal?: boolean }
): NpcDialogueService {
  const readContext = (npcId: NpcId, playerInput: string) =>
    buildNpcDialogueContext(getState(), npcId, playerInput);
  const mock = createMockNpcDialogueService(readContext);
  if (!options?.forceReal && !options?.transport && !shouldUseRealAiClient()) {
    return mock;
  }
  return createRealNpcDialogueService({
    readContext,
    getTurnId: () => getState().world.turn,
    fallback: mock,
    transport: options?.transport,
  });
}
