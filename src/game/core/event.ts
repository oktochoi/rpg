import type { ChoiceId, EncounterId, FactId, MemoryId, NpcId, QuestId, SaveSlotId, SceneId } from './ids';
import type { MenuId } from './command';
import type { GameState } from './game-state';
import type { NpcKnowledgeEntry } from '../npc/npc-knowledge';
import type { NPCMemory } from '../npc/memory/memory-types';
import type { WorldFact } from '../world/facts/world-fact';
import type { HistoryEntry } from '../history/history-types';
import type { ActionResolution } from '../actions/action-types';
import type { RelationshipChangeReason } from '../relationships/relationship-types';
import type { QuestStatus } from '../story/quest-state';

/**
 * Validated state change. All GameState updates must happen through Events.
 */
export type GameEvent =
  | { type: 'CHOICE_RESOLVED'; choiceId: ChoiceId }
  | { type: 'FREE_INPUT_RESOLVED'; text: string }
  | { type: 'ACTION_RESOLVE_STARTED'; turnId: number; input: string }
  | { type: 'ACTION_RESOLVED'; turnId: number; resolution: ActionResolution }
  | { type: 'PLAYER_LINE_RECORDED'; text: string }
  | { type: 'GOLD_SPENT'; amount: number }
  | { type: 'NPC_RECEIVED_GOLD'; npcId: NpcId; amount: number }
  | { type: 'ITEM_RECEIVED'; itemId: string; quantity?: number }
  | { type: 'ITEM_OBTAINED'; itemId: string; quantity: number; sourceEventId: string }
  | { type: 'ITEM_PURCHASED'; itemId: string; quantity: number; price: number; sourceEventId: string }
  | { type: 'ITEM_SOLD'; itemId: string; quantity: number; price: number; sourceEventId: string }
  | { type: 'ITEM_EQUIPPED'; itemId: string; slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY' }
  | { type: 'ITEM_UNEQUIPPED'; itemId: string; slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY' }
  | { type: 'EQUIPMENT_ENHANCED'; itemId: string; fromLevel: number; toLevel: number }
  | { type: 'ENCOUNTER_CLEARED'; encounterId: string }
  | { type: 'DIALOGUE_TOPIC_CONSUMED'; topicId: string }
  | { type: 'SEMANTIC_ACTION_RECORDED'; semanticKey: string; stateHash?: string }
  | { type: 'PLAYER_GOLD_GAINED'; amount: number; reason: string; sourceEventId: string }
  | { type: 'PLAYER_GOLD_SPENT'; amount: number; reason: string; sourceEventId: string }
  | { type: 'AREA_INVESTIGATED'; locationId: string }
  | { type: 'LOCATION_LEFT'; locationId: string }
  | { type: 'LOCATION_ENTERED'; locationId: string }
  | { type: 'LOCATION_DISCOVERED'; locationId: string }
  | { type: 'NPC_MOVED'; npcId: NpcId; fromLocationId: string; toLocationId: string }
  | { type: 'WORLD_FLAG_SET'; flagId: string; value: boolean }
  | { type: 'WORLD_COUNTER_SET'; counterId: string; value: number }
  | { type: 'EXPLORATION_POINT_COMPLETED'; pointId: string; locationId: string }
  | { type: 'PLAYER_GOLD_UPDATED'; gold: number }
  | { type: 'PLAYER_CLASS_UPDATED'; classId: string }
  | { type: 'STORY_UPDATED'; sceneId: SceneId }
  | { type: 'STORY_SCENE_ENTERED'; sceneId: SceneId }
  | { type: 'DIALOGUE_STARTED'; npcId: NpcId }
  | { type: 'DIALOGUE_ENDED'; npcId: NpcId }
  | { type: 'COMBAT_STARTED'; combatId: EncounterId }
  | { type: 'COMBAT_ENDED'; combatId: EncounterId }
  | { type: 'COMBAT_WON'; combatId: EncounterId; defeatedEnemyIds: readonly string[] }
  | { type: 'COMBAT_LOST'; combatId: EncounterId }
  | { type: 'PLAYER_COMBAT_HP_UPDATED'; currentHp: number }
  | { type: 'PLAYER_COMBAT_MP_UPDATED'; currentMp: number }
  | { type: 'ENEMY_DEFEATED'; enemyId: string }
  | { type: 'PLAYER_DEFEATED' }
  | { type: 'WORLD_FACT_RECORDED'; fact: WorldFact }
  | { type: 'PLAYER_LEARNED_FACT'; factId: FactId }
  | { type: 'NPC_LEARNED_FACT'; npcId: NpcId; entry: NpcKnowledgeEntry }
  | { type: 'DIALOGUE_TURN_RECORDED'; npcId: NpcId; playerText: string; npcText: string }
  | { type: 'RELATIONSHIP_UPDATED'; npcId: NpcId; trust?: number; fear?: number; respect?: number; affection?: number }
  | {
      type: 'NPC_RELATIONSHIP_CHANGED';
      npcId: NpcId;
      delta: { affection: number; trust: number; fear: number; respect: number };
      reason: RelationshipChangeReason;
      sourceEventId: string;
    }
  | { type: 'QUEST_UPDATED'; questId: QuestId; status?: QuestStatus }
  | { type: 'QUEST_AVAILABLE'; questId: QuestId }
  | { type: 'QUEST_STARTED'; questId: QuestId }
  | { type: 'QUEST_OBJECTIVE_PROGRESS'; questId: QuestId; objectiveId: string; currentCount: number; completed: boolean }
  | { type: 'QUEST_OBJECTIVE_COMPLETED'; questId: QuestId; objectiveId: string }
  | { type: 'QUEST_COMPLETED'; questId: QuestId }
  | { type: 'QUEST_FAILED'; questId: QuestId }
  | { type: 'NPC_MEMORY_CREATED'; memory: NPCMemory }
  | { type: 'NPC_MEMORY_RECALLED'; npcId: NpcId; memoryIds: readonly MemoryId[]; turn: number }
  | { type: 'MENU_OPENED'; menu: MenuId }
  | { type: 'MENU_CLOSED' }
  | { type: 'SAVE_NOTICE'; message: string }
  | { type: 'GAME_SAVED'; slotId: SaveSlotId }
  | { type: 'GAME_LOADED'; slotId: SaveSlotId; gameState: GameState }
  | { type: 'GAME_STARTED'; name?: string; classId?: string }
  | {
      type: 'TIME_ADVANCED';
      minutes: number;
      reason: string;
      sourceActionId: string;
      previousTotalMinutes: number;
      newTotalMinutes: number;
    }
  | { type: 'DAY_ADVANCED'; fromDay: number; toDay: number; reason: 'REST' | 'CHAPTER' | 'STORY' }
  | { type: 'TURN_REWARDS_APPLIED'; minutes: number; exp: number; sourceActionId: string }
  | { type: 'ACTION_REPEAT_COUNTED'; key: string }
  | { type: 'PLAYER_CLASS_PATH_CHOSEN'; classId: string }
  | { type: 'PLAYER_RESTORED'; currentHp: number; currentMp: number }
  | { type: 'PLAYER_EXP_GAINED'; amount: number; sourceEventId: string; reason: string }
  | { type: 'PLAYER_LEVEL_UP'; fromLevel: number; toLevel: number; hpDelta: number; mpDelta: number; attackDelta: number; statPointsGranted: number }
  | { type: 'STAT_POINT_SPENT'; statId: string; sourceEventId: string }
  | { type: 'STORY_CONTINUED'; sceneId?: string }
  | { type: 'CHAPTER_STARTED'; chapterId: string }
  | { type: 'CHAPTER_COMPLETED'; chapterId: string }
  | { type: 'ADVENTURE_STARTED'; adventureId: string }
  | { type: 'ADVENTURE_ENDED'; adventureId: string }
  | { type: 'HISTORY_RECORDED'; entry: HistoryEntry }
  | { type: 'ITEM_CONSUMED'; itemId: string }
  | {
      type: 'COMBAT_UPGRADE_APPLIED';
      upgradeId: string;
      sourceEventId: string;
      mods: { attackPercent: number; rangePercent: number; maxHpFlat: number };
    };
