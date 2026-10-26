import type { Choice } from '../story/choice';
import type { GameState } from '../core/game-state';
import { getAvailableChoices } from '../story/story-choice-service';

export const CHOICE_ACCEPT_RUINS_MYSTERY = 'accept_ruins_mystery';
export const CHOICE_ENTER_RUINS = 'enter_ruins_interior';
export const CHOICE_FIGHT_RUINS_MIXED = 'fight_ruins_mixed';
export const CHOICE_TALK_RUINS_PROGRESS = 'talk_ruins_progress';
export const CHOICE_REPORT_RUINS = 'report_ruins_mystery';

export function storyChoicesForState(state: Readonly<GameState>): readonly Choice[] {
  return getAvailableChoices(state);
}
