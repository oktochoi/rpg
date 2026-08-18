import type { GameEvent } from './event';
import type { GameState } from './game-state';
import { eventsForLocationProgress } from '../world/locations/location-service';
import { eventsForNewlyAvailableQuests, eventsForQuestProgress } from '../quests/quest-service';
import { eventsForTurnRewards } from '../player/progression/action-rewards';
import { eventsForLateProgression, eventsForProgression } from '../player/progression/progression-rules';
import { eventsForStoryProgress } from '../story/story-progress';

export function resolvePlayerTurnEvents(state: Readonly<GameState>, ruleEvents: readonly GameEvent[]): GameEvent[] {
  const events = [...ruleEvents, ...eventsForLocationProgress(state, ruleEvents)];
  const withQuest = [...events, ...eventsForQuestProgress(state, events)];
  const withTurn = [...withQuest, ...eventsForTurnRewards(state, withQuest)];
  const withProgression = [...withTurn, ...eventsForProgression(state, withTurn)];
  const withStory = [...withProgression, ...eventsForStoryProgress(state, withProgression)];
  const withLateQuest = [...withStory, ...eventsForNewlyAvailableQuests(state, withStory)];
  return [...withLateQuest, ...eventsForLateProgression(state, withLateQuest)];
}
