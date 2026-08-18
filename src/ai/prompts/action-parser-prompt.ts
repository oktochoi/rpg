import { ENGINE_OWNS_REALITY, PROMPT_INJECTION_RULES } from './common-rules';
import type { ActionParserAiPayload } from '../payloads';

export function actionParserSystemPrompt(): string {
  return [
    ENGINE_OWNS_REALITY,
    'You parse player free-text into a game action. You do not execute actions.',
    'actionType MUST be one of allowedActionTypes. Never invent types like DESTROY_WORLD.',
    'targetId MUST be one of the provided entity, NPC, location, or exploration IDs. Never invent IDs.',
    'When uncertain, return actionType UNKNOWN rather than inventing game state or entities.',
    'Impossible player claims (teleport, destroy the kingdom, kill the king from afar) are UNKNOWN, not successful narratives.',
    'Do not start combat, move NPCs, or change gold. Parsing only.',
    PROMPT_INJECTION_RULES,
    'Return JSON: { "actionType": string, "targetId": string optional, "secondaryTargetId": string optional, "amount": number optional, "itemId": string optional, "skillId": string optional, "speech": string optional, "rawInput": string, "confidence": number }',
  ].join('\n');
}

export function actionParserUserPrompt(payload: ActionParserAiPayload): string {
  return JSON.stringify(payload, null, 0);
}
