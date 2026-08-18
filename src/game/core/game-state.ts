import type { NpcId, QuestId, EncounterId } from './ids';
import type { GameMode } from './game-mode';
import type { MenuId } from './command';
import type { WorldState } from './world-state';
import type { NpcState } from '../npc/npc-state';
import type { RelationshipState } from '../npc/relationship';
import type { NPCMemory } from '../npc/memory/memory-types';
import type { PlayerState } from '../player/player-state';
import type { QuestState } from '../story/quest-state';
import type { StoryState } from '../story/story-state';
import type { PlayerKnowledge } from '../knowledge/player-knowledge';
import type { ActionResolution } from '../actions/action-types';
import type { HistoryEntry } from '../history/history-types';

export interface EconomyNotice {
  id: string;
  title: string;
  detail?: string;
}

/**
 * Single source of truth for the RPG.
 * CombatState is not stored here; Phaser owns it temporarily during combat.
 * WorldFact lives in world.facts. NPC AI must not read that list directly.
 */
export interface GameState {
  mode: GameMode;
  activeCombatId: EncounterId | null;
  pendingFreeActionTurnId: number | null;
  lastActionResolution: ActionResolution | null;
  lastTurnSummary: { minutes: number; exp: number; sourceActionId: string } | null;
  processedRelationshipSourceIds: readonly string[];
  processedMemorySourceIds: readonly string[];
  processedExpSourceIds: readonly string[];
  processedTurnRewardIds: readonly string[];
  processedRewardIds: readonly string[];
  actionRepeatCounts: Readonly<Record<string, number>>;
  activeMenu: MenuId | null;
  saveNotice: string | null;
  lastEconomyNotice: EconomyNotice | null;
  history: readonly HistoryEntry[];
  player: PlayerState;
  knowledge: PlayerKnowledge;
  npcs: Readonly<Record<NpcId, NpcState>>;
  relationships: Readonly<Record<NpcId, RelationshipState>>;
  npcMemories: Readonly<Record<NpcId, readonly NPCMemory[]>>;
  story: StoryState;
  world: WorldState;
  quests: Readonly<Record<QuestId, QuestState>>;
}
