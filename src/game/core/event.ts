import type { ChoiceId, EncounterId, NpcId, QuestId, SaveSlotId } from './ids';

/**
 * Validated state change. All GameState updates must happen through Events.
 */
export type GameEvent =
  | { type: 'CHOICE_RESOLVED'; choiceId: ChoiceId }
  | { type: 'FREE_INPUT_RESOLVED'; text: string }
  | { type: 'STORY_UPDATED' }
  | { type: 'DIALOGUE_STARTED'; npcId: NpcId }
  | { type: 'DIALOGUE_ENDED'; npcId: NpcId }
  | { type: 'COMBAT_STARTED'; encounterId: EncounterId }
  | { type: 'COMBAT_ENDED'; encounterId: EncounterId }
  | { type: 'QUEST_UPDATED'; questId: QuestId }
  | { type: 'GAME_SAVED'; slotId: SaveSlotId }
  | { type: 'GAME_LOADED'; slotId: SaveSlotId };
