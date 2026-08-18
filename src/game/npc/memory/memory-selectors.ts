import type { GameState } from '../../core/game-state';
import type { NpcId } from '../../core/ids';
import type { NPCMemory, RelevantMemoryContext } from './memory-types';

export function getMemoriesForNpc(state: Readonly<GameState>, npcId: NpcId): readonly NPCMemory[] {
  return state.npcMemories[npcId] ?? [];
}

export function getImportantMemoriesForNpc(
  state: Readonly<GameState>,
  npcId: NpcId,
  minimumImportance: number
): readonly NPCMemory[] {
  return getMemoriesForNpc(state, npcId)
    .filter((memory) => memory.importance >= minimumImportance)
    .slice()
    .sort(compareMemoryPriority);
}

export function getRelevantMemoriesForNpc(
  state: Readonly<GameState>,
  npcId: NpcId,
  context: RelevantMemoryContext = {}
): readonly NPCMemory[] {
  const memories = getMemoriesForNpc(state, npcId);
  if (memories.length === 0) {
    return [];
  }

  const keywords = keywordsFromInput(context.playerInput ?? '');
  if (keywords.length === 0) {
    return memories
      .filter((memory) => memory.importance >= 7)
      .slice()
      .sort(compareMemoryPriority)
      .slice(0, 2);
  }

  const scored = memories.map((memory) => ({
    memory,
    score: scoreMemory(memory, keywords, context),
  }));

  const matched = scored.filter((item) => item.score >= 40).sort((a, b) => b.score - a.score);
  if (matched.length > 0) {
    return matched.slice(0, 3).map((item) => item.memory);
  }

  return memories
    .filter((memory) => memory.importance >= 7)
    .slice()
    .sort(compareMemoryPriority)
    .slice(0, 2);
}

export function formatNpcMemoriesDebug(state: Readonly<GameState>, npcId: NpcId): string {
  const name = (state.npcs[npcId]?.name ?? npcId).toUpperCase();
  const lines = getMemoriesForNpc(state, npcId)
    .slice()
    .sort(compareMemoryPriority)
    .map((memory) => `[${memory.importance}] ${memory.summary}\n${memory.emotionalTag ?? 'NEUTRAL'}`);
  return [`=== ${name} MEMORY ===`, lines.length > 0 ? lines.join('\n\n') : '(none)'].join('\n\n');
}

function compareMemoryPriority(a: NPCMemory, b: NPCMemory): number {
  if (b.importance !== a.importance) {
    return b.importance - a.importance;
  }
  return b.createdAtTurn - a.createdAtTurn;
}

function scoreMemory(memory: NPCMemory, keywords: readonly string[], context: RelevantMemoryContext): number {
  let score = memory.importance * 8 + memory.createdAtTurn;
  const haystack = `${memory.summary} ${memory.type} ${memory.relatedFactIds.join(' ')} ${context.locationId ?? ''}`.toLowerCase();
  for (const keyword of keywords) {
    if (haystack.includes(keyword) || memory.type === keyword) {
      score += 50;
    }
  }
  return score;
}

function keywordsFromInput(playerInput: string): string[] {
  const text = playerInput.toLowerCase();
  const keywords: string[] = [];
  if (/폐허|고대|ruins|석문/.test(text)) {
    keywords.push('폐허', 'PLAYER_SAVED_ME', 'PLAYER_HELPED_ME', 'SHARED_EXPERIENCE');
  }
  if (/공격|때렸|쓰러|결투/.test(text)) {
    keywords.push('PLAYER_ATTACKED_ME', '공격');
  }
  if (/협박|위협/.test(text)) {
    keywords.push('PLAYER_THREATENED_ME', '협박');
  }
  if (/돕|도와|도움/.test(text)) {
    keywords.push('PLAYER_HELPED_ME', 'PLAYER_SAVED_ME', '도왔');
  }
  if (/구했|구한|구출|살렸/.test(text)) {
    keywords.push('PLAYER_SAVED_ME', '구했');
  }
  if (/믿|기억|약속/.test(text)) {
    keywords.push('PLAYER_SAVED_ME', 'PLAYER_HELPED_ME', 'PLAYER_KEPT_PROMISE', 'PLAYER_BROKE_PROMISE');
  }
  if (/선물|줬/.test(text)) {
    keywords.push('PLAYER_GAVE_GIFT');
  }
  return keywords;
}
