import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import type { FactId, MemoryId, NpcId } from '../../core/ids';
import type { RelationshipRequest } from '../../relationships/relationship-types';
import { memorySourceId, toNpcMemory } from './memory-rules';
import {
  FORGET_LOW_IMPORTANCE_AFTER_TURNS,
  LOW_MEMORY_IMPORTANCE,
  MAX_MEMORIES_PER_NPC,
  PROTECTED_MEMORY_IMPORTANCE,
  type NPCMemory,
} from './memory-types';

export function eventsForMemoryRequests(
  state: Readonly<GameState>,
  requests: readonly RelationshipRequest[],
  relatedFactIds: readonly FactId[] = []
): GameEvent[] {
  const events: GameEvent[] = [];
  const seen = new Set(state.processedMemorySourceIds);

  for (const request of requests) {
    const sourceEventId = memorySourceId(request.sourceEventId);
    if (seen.has(sourceEventId)) {
      continue;
    }
    if (!state.npcs[request.npcId]) {
      continue;
    }
    const memory = toNpcMemory(state, request, relatedFactIds);
    if (!memory) {
      continue;
    }
    seen.add(sourceEventId);
    events.push({ type: 'NPC_MEMORY_CREATED', memory });
  }

  return events;
}

export function eventsForMemoryRecall(
  npcId: NpcId,
  memoryIds: readonly MemoryId[],
  turn: number
): GameEvent[] {
  const ids = [...new Set(memoryIds.filter(Boolean))];
  if (ids.length === 0) {
    return [];
  }
  return [{ type: 'NPC_MEMORY_RECALLED', npcId, memoryIds: ids, turn }];
}

export function trimNpcMemories(memories: readonly NPCMemory[], currentTurn: number): NPCMemory[] {
  const kept = memories.filter((memory) => {
    if (memory.importance >= PROTECTED_MEMORY_IMPORTANCE) {
      return true;
    }
    if (memory.importance <= LOW_MEMORY_IMPORTANCE) {
      return currentTurn - memory.createdAtTurn < FORGET_LOW_IMPORTANCE_AFTER_TURNS;
    }
    return true;
  });

  if (kept.length <= MAX_MEMORIES_PER_NPC) {
    return kept;
  }

  const protectedMemories = kept.filter((memory) => memory.importance >= PROTECTED_MEMORY_IMPORTANCE);
  const removable = kept
    .filter((memory) => memory.importance < PROTECTED_MEMORY_IMPORTANCE)
    .sort((a, b) => {
      if (a.importance !== b.importance) {
        return a.importance - b.importance;
      }
      return a.createdAtTurn - b.createdAtTurn;
    });

  const room = Math.max(0, MAX_MEMORIES_PER_NPC - protectedMemories.length);
  return [...protectedMemories, ...removable.slice(Math.max(0, removable.length - room))].sort(
    (a, b) => a.createdAtTurn - b.createdAtTurn
  );
}
