import type { GameEvent } from './event';
import type { GameState } from './game-state';
import { applyEvents } from './reducer';
import { eventsForLocationProgress } from '../world/locations/location-service';
import { eventsForNewlyAvailableQuests, eventsForQuestProgress } from '../quests/quest-service';
import { eventsForTurnRewards } from '../player/progression/action-rewards';
import { eventsForLateProgression, eventsForProgression } from '../player/progression/progression-rules';
import { eventsForStoryProgress } from '../story/story-progress';

export function resolvePlayerTurnEvents(state: Readonly<GameState>, ruleEvents: readonly GameEvent[]): GameEvent[] {
  const events = [...ruleEvents, ...eventsForLocationProgress(state, ruleEvents)];
  const withQuest = [...events, ...eventsForQuestProgress(state, events)];
  const withTurn = [...withQuest, ...eventsForTurnRewards(state, withQuest)];
  const progressionEvents = eventsForProgression(state, withTurn);
  const withProgression = [...withTurn, ...progressionEvents];
  // Loot / key drops from progression must also advance quest objectives.
  const afterCombatRewards = applyEvents(state, withTurn);
  const questFromProgression = eventsForQuestProgress(afterCombatRewards, progressionEvents);
  const withQuestAfterProgression = [...withProgression, ...questFromProgression];
  const withStory = [...withQuestAfterProgression, ...eventsForStoryProgress(state, withQuestAfterProgression)];
  const withLateQuest = [...withStory, ...eventsForNewlyAvailableQuests(state, withStory)];
  const late = eventsForLateProgression(state, withLateQuest);
  if (late.length === 0) {
    return withLateQuest;
  }
  // Adventure auto-return (LOCATION_ENTERED village) must re-resolve story after late events.
  const afterMain = applyEvents(state, withLateQuest);
  const storyAfterLate = eventsForStoryProgress(afterMain, late);
  return [...withLateQuest, ...late, ...storyAfterLate];
}
