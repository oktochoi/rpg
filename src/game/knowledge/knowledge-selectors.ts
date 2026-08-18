import type { GameState } from '../core/game-state';
import type { ActorId, FactId, NpcId } from '../core/ids';
import { PLAYER_ACTOR_ID } from './knowledge-config';
import {
  defaultConfidence,
  npcKnowsFact,
  type KnowledgeSourceType,
  type NpcKnowledgeEntry,
} from '../npc/npc-knowledge';
import type { WorldFact } from '../world/facts/world-fact';

function factById(state: Readonly<GameState>, factId: FactId): WorldFact | undefined {
  return state.world.facts.find((fact) => fact.id === factId);
}

/**
 * NPC AI and dialogue must use this selector.
 * Do not read state.world.facts directly from NPC systems.
 */
export function getKnownFactsForNpc(state: Readonly<GameState>, npcId: NpcId): WorldFact[] {
  const npc = state.npcs[npcId];
  if (!npc) {
    return [];
  }

  const facts: WorldFact[] = [];
  for (const entry of npc.knowledge.entries) {
    const fact = factById(state, entry.factId);
    if (fact) {
      facts.push(fact);
    } else {
      console.warn(`[knowledge] NPC ${npcId} has unknown factId: ${entry.factId}`);
    }
  }
  return facts;
}

export function doesNpcKnowFact(state: Readonly<GameState>, npcId: NpcId, factId: FactId): boolean {
  const npc = state.npcs[npcId];
  if (!npc) {
    return false;
  }
  return npcKnowsFact(npc.knowledge, factId);
}

export function getPlayerKnownFacts(state: Readonly<GameState>): WorldFact[] {
  return state.world.facts.filter((fact) => state.knowledge.knownFactIds.includes(fact.id));
}

export function doesPlayerKnowFact(state: Readonly<GameState>, factId: FactId): boolean {
  return state.knowledge.knownFactIds.includes(factId);
}

export function actorKnowsFact(state: Readonly<GameState>, actorId: ActorId, factId: FactId): boolean {
  if (actorId === PLAYER_ACTOR_ID) {
    return doesPlayerKnowFact(state, factId);
  }
  return doesNpcKnowFact(state, actorId, factId);
}

export function createWitnessEntry(factId: FactId, turn: number): NpcKnowledgeEntry {
  return {
    factId,
    sourceType: 'WITNESSED',
    confidence: defaultConfidence('WITNESSED'),
    learnedAtTurn: turn,
  };
}

export interface ShareFactInput {
  factId: FactId;
  fromId: ActorId;
  toId: NpcId;
  sourceType?: KnowledgeSourceType;
}

export function createSharedFactEntry(
  state: Readonly<GameState>,
  input: ShareFactInput
): NpcKnowledgeEntry | null {
  const fact = factById(state, input.factId);
  if (!fact) {
    return null;
  }
  if (input.fromId === input.toId) {
    return null;
  }
  if (!actorKnowsFact(state, input.fromId, input.factId)) {
    return null;
  }
  if (doesNpcKnowFact(state, input.toId, input.factId)) {
    return null;
  }

  const sourceType: KnowledgeSourceType =
    input.sourceType ?? (input.fromId === PLAYER_ACTOR_ID ? 'TOLD_BY_PLAYER' : 'TOLD_BY_NPC');

  return {
    factId: input.factId,
    sourceType,
    sourceId: input.fromId,
    confidence: defaultConfidence(sourceType),
    learnedAtTurn: state.world.turn,
  };
}

export function createPublicFactEntry(factId: FactId, turn: number): NpcKnowledgeEntry {
  return {
    factId,
    sourceType: 'PUBLIC_EVENT',
    confidence: defaultConfidence('PUBLIC_EVENT'),
    learnedAtTurn: turn,
  };
}
