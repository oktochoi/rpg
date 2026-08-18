import type { CombatResult } from '../combat/types/combat-result';
import type { ResolvedFreeAction } from '../actions/action-resolver';
import type { ChoiceId, EncounterId, FactId, MemoryId, NpcId, QuestId, SaveSlotId } from './ids';
import type { PlayerClassId } from '../player/classes/class-types';

export type MenuId =
  | 'character'
  | 'characters'
  | 'inventory'
  | 'map'
  | 'quest'
  | 'journal'
  | 'save'
  | 'settings'
  | 'shop';

/**
 * Player/UI intent. React components may only dispatch Commands.
 * Commands never mutate GameState directly.
 */
export type Command =
  | { type: 'SELECT_CHOICE'; choiceId: ChoiceId }
  | { type: 'SELECT_DYNAMIC_CHOICE'; choiceId: ChoiceId; turnId: number; candidateId: string }
  | { type: 'SUBMIT_FREE_INPUT'; text: string }
  | { type: 'FREE_ACTION'; turnId: number; input: string }
  | { type: 'COMMIT_FREE_ACTION'; payload: ResolvedFreeAction; turnId: number; rawInput: string }
  | { type: 'START_DIALOGUE'; npcId: NpcId }
  | { type: 'END_DIALOGUE' }
  | { type: 'START_COMBAT'; combatId: EncounterId }
  | { type: 'RESOLVE_COMBAT'; result: CombatResult }
  | { type: 'SHARE_FACT'; factId: FactId; fromId: NpcId | 'player'; toId: NpcId }
  | { type: 'GRANT_FACT'; factId: FactId; npcId: NpcId }
  | { type: 'RECORD_DIALOGUE'; npcId: NpcId; playerText: string; npcText: string; usedMemoryIds?: readonly MemoryId[] }
  | { type: 'SET_RELATIONSHIP'; npcId: NpcId; trust?: number; fear?: number; respect?: number; affection?: number }
  | { type: 'SET_PLAYER_GOLD'; gold: number }
  | { type: 'SET_PLAYER_CLASS'; classId: string }
  | { type: 'ACCEPT_QUEST'; questId: QuestId }
  | { type: 'COMPLETE_QUEST'; questId: QuestId }
  | { type: 'FAIL_QUEST'; questId: QuestId }
  | { type: 'MOVE_TO_LOCATION'; locationId: string }
  | { type: 'MOVE_NPC'; npcId: NpcId; locationId: string }
  | { type: 'ENTER_STORY_SCENE'; sceneId: string }
  | { type: 'END_COMBAT' }
  | { type: 'OPEN_MENU'; menu?: MenuId }
  | { type: 'CLOSE_MENU' }
  | { type: 'SAVE_GAME'; slotId: SaveSlotId }
  | { type: 'LOAD_GAME'; slotId: SaveSlotId }
  | { type: 'DELETE_SAVE'; slotId: SaveSlotId }
  | { type: 'NEW_GAME'; name?: string; classId?: PlayerClassId }
  | { type: 'CHOOSE_CLASS_PATH'; classId: PlayerClassId }
  | { type: 'REST' }
  | { type: 'USE_ITEM'; itemId: string }
  | { type: 'EQUIP_ITEM'; itemId: string }
  | { type: 'UNEQUIP_ITEM'; slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY' }
  | { type: 'BUY_ITEM'; itemId: string }
  | { type: 'SELL_ITEM'; itemId: string; quantity?: number }
  | { type: 'ENHANCE_EQUIPMENT'; itemId: string }
  | { type: 'ALLOCATE_STAT_POINT'; statId: string }
  | { type: 'CONTINUE_STORY' };

export type CommandDispatcher = (command: Command) => void;
