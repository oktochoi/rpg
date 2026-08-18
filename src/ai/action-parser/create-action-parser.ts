import { shouldUseRealAiClient, getSharedAiTransport, type AiTransport } from '../client/ai-transport';
import { createMockActionParser } from './mockActionParser';
import { createRealActionParser } from './real-action-parser';
import type { ActionParser } from './types';

export function createActionParser(options?: {
  transport?: AiTransport;
  getTurnId?: () => number;
  forceReal?: boolean;
}): ActionParser {
  const mock = createMockActionParser();
  if (!options?.forceReal && !options?.transport && !shouldUseRealAiClient()) {
    return mock;
  }
  return createRealActionParser({
    fallback: mock,
    transport: options?.transport ?? getSharedAiTransport(),
    getTurnId: options?.getTurnId,
  });
}
