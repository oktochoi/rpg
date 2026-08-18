import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { applyEvents } from '../core/reducer';
import { getStorySceneDefinition } from './story-scene-definitions';
import { resolveNextScene, shouldResolveStory } from './story-scene-resolver';
import type { StorySceneEffect } from './story-scene-types';

function eventsForSceneEffects(state: Readonly<GameState>, effects: readonly StorySceneEffect[] | undefined): GameEvent[] {
  if (!effects || effects.length === 0) {
    return [];
  }
  const events: GameEvent[] = [];
  for (const effect of effects) {
    if (effect.type === 'SET_WORLD_FLAG' && state.world.flags[effect.flagId] !== effect.value) {
      events.push({ type: 'WORLD_FLAG_SET', flagId: effect.flagId, value: effect.value });
    }
    if (effect.type === 'DISCOVER_LOCATION' && state.world.locations[effect.locationId]?.discovered !== true) {
      events.push({ type: 'LOCATION_DISCOVERED', locationId: effect.locationId });
    }
    if (effect.type === 'GRANT_ITEM') {
      events.push({
        type: 'ITEM_OBTAINED',
        itemId: effect.itemId,
        quantity: effect.quantity,
        sourceEventId: effect.sourceEventId,
      });
    }
  }
  return events;
}

function firstEnterEffects(state: Readonly<GameState>, sceneId: string): GameEvent[] {
  if ((state.story.visitedSceneIds ?? []).includes(sceneId)) {
    return [];
  }
  const definition = getStorySceneDefinition(sceneId);
  return eventsForSceneEffects(state, definition?.onEnter);
}

export function eventsForStoryProgress(state: Readonly<GameState>, incoming: readonly GameEvent[]): GameEvent[] {
  if (incoming.length === 0) {
    return [];
  }

  const entered = incoming.filter((event): event is Extract<GameEvent, { type: 'STORY_SCENE_ENTERED' }> => {
    return event.type === 'STORY_SCENE_ENTERED';
  });
  if (entered.length > 0) {
    const outgoing: GameEvent[] = [];
    let simulated = applyEvents(state, incoming.filter((event) => event.type !== 'STORY_SCENE_ENTERED'));
    for (const event of entered) {
      outgoing.push(...firstEnterEffects(simulated, event.sceneId));
      simulated = applyEvents(simulated, [{ type: 'STORY_SCENE_ENTERED', sceneId: event.sceneId }]);
    }
    return outgoing;
  }

  if (!shouldResolveStory(incoming)) {
    return [];
  }

  const simulated = applyEvents(state, incoming);
  if (simulated.mode === 'COMBAT') {
    return [];
  }
  const next = resolveNextScene(simulated, { incoming });
  if (!next || next.id === simulated.story.currentSceneId) {
    return [];
  }
  return [{ type: 'STORY_SCENE_ENTERED', sceneId: next.id }, ...firstEnterEffects(simulated, next.id)];
}
