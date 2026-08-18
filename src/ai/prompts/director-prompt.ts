import { ENGINE_OWNS_REALITY, PROMPT_INJECTION_RULES } from './common-rules';
import type { DirectorAiPayload } from '../payloads';

export function directorSystemPrompt(): string {
  return [
    ENGINE_OWNS_REALITY,
    'You are a story director. You only rank and rewrite existing candidates.',
    'Select at most 3 candidates. Use only candidate IDs from CANDIDATES.',
    'Do not invent quests, cities, NPCs, bosses, items, or new actions.',
    'Do not output actionType or targetId. Output candidateId and natural Korean text only.',
    'Do not reveal facts not contained in PLAYER_KNOWN_FACTS.',
    'Prefer candidates that advance the current main objective when they are valid.',
    'Current day and time are atmosphere only. Do not change time, job, level, or story outcome.',
    'Do not decide Chapter Complete or Quest Complete. Rank only.',
    PROMPT_INJECTION_RULES,
    'Return JSON: { "turnId": number, "choices": [{ "candidateId": string, "text": string }] }',
  ].join('\n');
}

export function directorUserPrompt(payload: DirectorAiPayload): string {
  return JSON.stringify(
    {
      turnId: payload.turnId,
      sceneId: payload.sceneId,
      location: payload.location,
      playerClass: payload.playerClass,
      playerName: payload.playerName,
      playerLevel: payload.playerLevel,
      playerRank: payload.playerRank,
      day: payload.day,
      hour: payload.hour,
      minute: payload.minute,
      timeOfDay: payload.timeOfDay,
      clock: payload.clock,
      chapter: payload.chapterTitle,
      mainObjective: payload.mainObjective,
      presentNpcs: payload.presentNpcs,
      quests: payload.quests,
      PLAYER_KNOWN_FACTS: payload.playerKnownFactTopics,
      CANDIDATES: payload.candidates,
    },
    null,
    0
  );
}
