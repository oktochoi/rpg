import type { GameState } from '../core/game-state';
import { REPEAT_POLICY, dialogueStateKey, type DialogueTopicDefinition } from './dialogue-topics';

const RECENT_LIMIT = 8;

export function consumedTopicIds(state: Readonly<GameState>): readonly string[] {
  return state.story.consumedTopicIds ?? [];
}

export function recentSemanticKeys(state: Readonly<GameState>): readonly string[] {
  return state.story.recentSemanticKeys ?? [];
}

export function isTopicAvailable(state: Readonly<GameState>, topic: DialogueTopicDefinition): boolean {
  const consumed = consumedTopicIds(state);
  const key = topicKey(topic);
  if (topic.repeatPolicy === REPEAT_POLICY.ONCE) {
    return !consumed.includes(key) && !consumed.includes(topic.topicId);
  }
  if (topic.repeatPolicy === REPEAT_POLICY.DAILY) {
    const dayKey = `${key}:day:${state.world.day ?? 1}`;
    return !consumed.includes(dayKey);
  }
  if (topic.repeatPolicy === REPEAT_POLICY.UNTIL_STATE_CHANGE) {
    const stateKey = `${key}:${dialogueStateKey(state, topic.npcId)}`;
    return !consumed.includes(stateKey);
  }
  return true;
}

export function consumptionIdFor(state: Readonly<GameState>, topic: DialogueTopicDefinition): string {
  const key = topicKey(topic);
  if (topic.repeatPolicy === REPEAT_POLICY.DAILY) {
    return `${key}:day:${state.world.day ?? 1}`;
  }
  if (topic.repeatPolicy === REPEAT_POLICY.UNTIL_STATE_CHANGE) {
    return `${key}:${dialogueStateKey(state, topic.npcId)}`;
  }
  return key;
}

export function shouldSuppressSemanticKey(state: Readonly<GameState>, semanticKey: string): boolean {
  const recent = recentSemanticKeys(state);
  if (!recent.includes(semanticKey)) {
    return false;
  }
  const hash = state.story.lastActionStateHash;
  const current = dialogueStateKey(state, semanticKey.split(':')[1] ?? '');
  return hash === current;
}

export function nextRecentSemanticKeys(state: Readonly<GameState>, semanticKey: string): string[] {
  const next = [...recentSemanticKeys(state).filter((item) => item !== semanticKey), semanticKey];
  return next.slice(-RECENT_LIMIT);
}

function topicKey(topic: DialogueTopicDefinition): string {
  return `${topic.npcId}:${topic.topicId}`;
}
