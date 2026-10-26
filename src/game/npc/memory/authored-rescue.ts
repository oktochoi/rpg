import { applyEvents } from '../../core/reducer';
import type { GameState } from '../../core/game-state';
import type { NpcId } from '../../core/ids';
import { authoredRescueRequest, eventsForRelationshipRequests } from '../../relationships/relationship-service';
import { eventsForMemoryRequests } from './memory-service';

export function withAuthoredRescue(state: GameState, npcId: NpcId = 'seria'): GameState {
  const request = authoredRescueRequest(npcId);
  return applyEvents(state, [
    ...eventsForRelationshipRequests(state, [request]),
    ...eventsForMemoryRequests(state, [request]),
  ]);
}
