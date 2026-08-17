import type { NpcId, QuestId } from './ids';
import type { WorldState } from './world-state';
import type { NpcState } from '../npc/npc-state';
import type { PlayerState } from '../player/player-state';
import type { QuestState } from '../story/quest-state';
import type { StoryState } from '../story/story-state';

/**
 * Single source of truth for the RPG.
 * CombatState is not stored here; Phaser owns it temporarily during combat.
 */
export interface GameState {
  player: PlayerState;
  npcs: Readonly<Record<NpcId, NpcState>>;
  story: StoryState;
  world: WorldState;
  quests: Readonly<Record<QuestId, QuestState>>;
}
