import type { ChoiceId, NpcId, SaveSlotId } from './ids';

export type MenuId = 'characters' | 'inventory' | 'map' | 'quest' | 'journal';

/**
 * Player/UI intent. React components may only dispatch Commands.
 * Commands never mutate GameState directly.
 */
export type Command =
  | { type: 'SELECT_CHOICE'; choiceId: ChoiceId }
  | { type: 'SUBMIT_FREE_INPUT'; text: string }
  | { type: 'START_DIALOGUE'; npcId: NpcId }
  | { type: 'END_DIALOGUE' }
  | { type: 'START_COMBAT' }
  | { type: 'END_COMBAT' }
  | { type: 'OPEN_MENU'; menu?: MenuId }
  | { type: 'CLOSE_MENU' }
  | { type: 'SAVE_GAME'; slotId: SaveSlotId }
  | { type: 'LOAD_GAME'; slotId: SaveSlotId };

export type CommandDispatcher = (command: Command) => void;
