import { z } from 'zod';
import { AI_ROLES, type AIRole } from './config/ai-config';

export interface NpcAiFactPayload {
  id: string;
  type: string;
  topic: string;
}

export interface NpcAiMemoryPayload {
  id: string;
  type: string;
  summary: string;
  importance: number;
}

export interface NpcAiPayload {
  npc: {
    id: string;
    name: string;
    role: string;
    personality: readonly string[];
    speakingStyle: string;
    values: readonly string[];
    currentGoal?: string;
  };
  relationship: {
    affection: number;
    trust: number;
    fear: number;
    respect: number;
    attitude: string;
    meaning: string;
  };
  knownFacts: readonly NpcAiFactPayload[];
  memories: readonly NpcAiMemoryPayload[];
  locationId: string;
  sceneId?: string;
  recentDialogue: readonly { speaker: string; text: string }[];
  relevantQuests: readonly { id: string; status: string }[];
  playerSaid: string;
  player?: {
    name: string;
    level: number;
    classDisplay: string;
    rank?: string;
  };
  world?: {
    day: number;
    hour?: number;
    minute?: number;
    timeOfDay?: string;
    clock?: string;
  };
  story?: {
    chapterTitle?: string;
    mainObjective?: string;
  };
}

export interface ActionParserAiEntity {
  id: string;
  name: string;
  aliases?: readonly string[];
  kind?: string;
}

export interface ActionParserAiPayload {
  rawInput: string;
  currentLocationId: string;
  currentSceneId?: string;
  playerClass?: string;
  presentNpcs: readonly ActionParserAiEntity[];
  knownEntities: readonly ActionParserAiEntity[];
  locations: readonly ActionParserAiEntity[];
  explorationIds: readonly string[];
  allowedActionTypes: readonly string[];
}

export interface DirectorAiCandidatePayload {
  id: string;
  intent: string;
  source: string;
  description: string;
  critical?: boolean;
}

export interface DirectorAiPayload {
  turnId: number;
  sceneId: string;
  location: { id: string; name: string };
  playerClass: string;
  playerName?: string;
  playerLevel?: number;
  playerRank?: string;
  day?: number;
  hour?: number;
  minute?: number;
  timeOfDay?: string;
  clock?: string;
  chapterTitle?: string;
  mainObjective?: string;
  presentNpcs: readonly { id: string; name: string }[];
  quests: readonly { title: string; objective: string }[];
  playerKnownFactTopics: readonly string[];
  candidates: readonly DirectorAiCandidatePayload[];
}

export type AiTaskPayload = NpcAiPayload | ActionParserAiPayload | DirectorAiPayload;

export interface AiRouteRequest {
  type: AIRole;
  turnId: number;
  requestId: string;
  payload: AiTaskPayload;
}

export interface AiRouteResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  model?: string;
  latencyMs?: number;
  fallbackUsed?: boolean;
  turnId: number;
  requestId: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

const AiRouteRequestSchema = z.object({
  type: z.enum(AI_ROLES),
  turnId: z.number().int().nonnegative(),
  requestId: z.string().min(1),
  payload: z.unknown(),
});

export function parseAiRouteRequest(value: unknown): AiRouteRequest | null {
  const parsed = AiRouteRequestSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return parsed.data as AiRouteRequest;
}
