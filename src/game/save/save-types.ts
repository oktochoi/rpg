import type { GameMode } from '../core/game-mode';
import type { GameState } from '../core/game-state';
import type { SaveSlotId } from '../core/ids';
import type { NpcId } from '../core/ids';
import type { NpcState } from '../npc/npc-state';
import type { NPCMemory } from '../npc/memory/memory-types';
import type { RelationshipState } from '../npc/relationship';
import type { PlayerKnowledge } from '../knowledge/player-knowledge';
import type { PlayerState } from '../player/player-state';
import type { QuestState } from '../story/quest-state';
import type { StoryState } from '../story/story-state';
import type { WorldState } from '../core/world-state';
import type { ActionResolution } from '../actions/action-types';
import type { HistoryEntry } from '../history/history-types';
import type { EncounterId } from '../core/ids';

export const SAVE_VERSION = 4;

export const MANUAL_SAVE_SLOTS: readonly SaveSlotId[] = ['slot_1', 'slot_2', 'slot_3'];
export const AUTO_SAVE_SLOT_ID: SaveSlotId = 'autosave';

export interface PersistedGameMeta {
  playTimeSeconds: number;
}

export interface PersistedGameState {
  meta: PersistedGameMeta;
  mode: GameMode;
  activeCombatId: EncounterId | null;
  pendingFreeActionTurnId: number | null;
  lastActionResolution: ActionResolution | null;
  processedRelationshipSourceIds: readonly string[];
  processedMemorySourceIds: readonly string[];
  processedExpSourceIds: readonly string[];
  processedTurnRewardIds?: readonly string[];
  processedRewardIds?: readonly string[];
  actionRepeatCounts?: Readonly<Record<string, number>>;
  player: PlayerState;
  world: WorldState;
  npcs: Readonly<Record<NpcId, NpcState>>;
  relationships: Readonly<Record<NpcId, RelationshipState>>;
  quests: Readonly<Record<string, QuestState>>;
  knowledge: PlayerKnowledge;
  npcMemories: Readonly<Record<NpcId, readonly NPCMemory[]>>;
  story: StoryState;
  history: readonly HistoryEntry[];
}

export interface SaveData {
  version: number;
  saveId: string;
  createdAt: string;
  updatedAt: string;
  playTimeSeconds: number;
  gameState: PersistedGameState;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  saveData?: SaveData;
  error?: string;
}

export interface SaveSlotSummary {
  slotId: SaveSlotId;
  empty: boolean;
  characterName?: string;
  classId?: string;
  classLabel?: string;
  level?: number;
  locationId?: string;
  locationLabel?: string;
  playTimeSeconds?: number;
  updatedAt?: string;
}

export interface SaveService {
  save(slotId: SaveSlotId, gameState: GameState, playTimeSeconds: number): SaveResult;
  load(slotId: SaveSlotId): LoadResult;
  delete(slotId: SaveSlotId): SaveResult;
  listSlots(): SaveSlotSummary[];
}

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function storageKeyForSlot(slotId: SaveSlotId): string {
  if (slotId === AUTO_SAVE_SLOT_ID) {
    return 'ai-rpg-autosave';
  }
  return `ai-rpg-save-${slotId.replace('_', '-')}`;
}

export function canSaveGame(state: Readonly<GameState>): boolean {
  return state.mode !== 'COMBAT' && state.mode !== 'RESOLVING';
}

export function saveBlockedReason(state: Readonly<GameState>): string | null {
  if (state.mode === 'COMBAT') {
    return '전투 중에는 저장할 수 없습니다.';
  }
  if (state.mode === 'RESOLVING') {
    return '지금은 저장할 수 없습니다.';
  }
  return null;
}
