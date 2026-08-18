import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { applyEvents } from '../core/reducer';
import { eventsForPlayerDiscoveredFact } from '../knowledge/knowledge-service';
import { getStorySceneDefinition } from './story-scene-definitions';
import { resolveNextScene, shouldResolveStory } from './story-scene-resolver';
import type { StorySceneEffect } from './story-scene-types';

function eventsForSceneEffects(state: Readonly<GameState>, effects: readonly StorySceneEffect[] | undefined): GameEvent[] {
  if (!effects || effects.length === 0) {
    return [];
  }
  const events: GameEvent[] = [];
  const learned = new Set(state.knowledge.knownFactIds);
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
    if (effect.type === 'LEARN_FACT' && !learned.has(effect.factId)) {
      const factEvents = eventsForPlayerDiscoveredFact(state, effect.factId);
      events.push(...factEvents);
      if (factEvents.length > 0) {
        learned.add(effect.factId);
      }
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
  const continued = incoming.filter((event): event is Extract<GameEvent, { type: 'STORY_CONTINUED' }> => {
    return event.type === 'STORY_CONTINUED' && Boolean(event.sceneId);
  });
  if (entered.length > 0 || continued.length > 0) {
    const outgoing: GameEvent[] = [];
    let simulated = applyEvents(state, incoming.filter((event) => event.type !== 'STORY_SCENE_ENTERED'));
    let lastSceneId = simulated.story.currentSceneId;
    const enterList =
      entered.length > 0
        ? entered
        : continued.flatMap((event) => (event.sceneId ? [{ type: 'STORY_SCENE_ENTERED' as const, sceneId: event.sceneId }] : []));
    for (const event of enterList) {
      const enterEffects = firstEnterEffects(simulated, event.sceneId);
      outgoing.push(...enterEffects);
      simulated = applyEvents(simulated, [{ type: 'STORY_SCENE_ENTERED', sceneId: event.sceneId }, ...enterEffects]);
      lastSceneId = event.sceneId;
    }
    outgoing.push(...followUpSceneEvents(simulated, lastSceneId, incoming));
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
  const enterEffects = firstEnterEffects(simulated, next.id);
  const afterEnter = applyEvents(simulated, [{ type: 'STORY_SCENE_ENTERED', sceneId: next.id }, ...enterEffects]);
  return [
    { type: 'STORY_SCENE_ENTERED', sceneId: next.id },
    ...enterEffects,
    ...followUpSceneEvents(afterEnter, next.id, incoming),
  ];
}

function followUpSceneEvents(
  state: Readonly<GameState>,
  currentSceneId: string,
  incoming: readonly GameEvent[]
): GameEvent[] {
  const follow = resolveNextScene(state, { incoming });
  if (!follow || follow.id === currentSceneId) {
    return [];
  }
  const currentPriority = getStorySceneDefinition(currentSceneId)?.priority ?? 0;
  const followPriority = follow.priority ?? 0;
  if (followPriority <= currentPriority) {
    return [];
  }
  const enterEffects = firstEnterEffects(state, follow.id);
  return [{ type: 'STORY_SCENE_ENTERED', sceneId: follow.id }, ...enterEffects];
}
