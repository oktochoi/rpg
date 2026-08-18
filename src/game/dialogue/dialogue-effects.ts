import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { consumptionIdFor, isTopicAvailable } from './dialogue-topic-state';
import { dialogueStateKey, topicsForNpc, type DialogueTopicDefinition } from './dialogue-topics';

export function topicForCandidate(
  state: Readonly<GameState>,
  npcId: string | undefined,
  topicId?: string,
  promptId?: string,
  semanticKey?: string
): DialogueTopicDefinition | null {
  if (!npcId) {
    return null;
  }
  const topics = topicsForNpc(state, npcId).filter((topic) => isTopicAvailable(state, topic));
  if (topicId) {
    return topics.find((topic) => topic.topicId === topicId) ?? null;
  }
  if (semanticKey) {
    return topics.find((topic) => topic.semanticKey === semanticKey) ?? null;
  }
  if (promptId) {
    return topics.find((topic) => topic.promptId === promptId) ?? null;
  }
  return null;
}

export function eventsForDialogueConsumption(
  state: Readonly<GameState>,
  options: { npcId?: string; topicId?: string; promptId?: string; semanticKey?: string }
): GameEvent[] {
  const npcId = options.npcId;
  const topic = topicForCandidate(state, npcId, options.topicId, options.promptId, options.semanticKey);
  const semanticKey = options.semanticKey ?? topic?.semanticKey;
  const events: GameEvent[] = [];
  if (semanticKey) {
    events.push({
      type: 'SEMANTIC_ACTION_RECORDED',
      semanticKey,
      stateHash: dialogueStateKey(state, npcId ?? semanticKey.split(':')[1] ?? ''),
    });
  }
  if (topic) {
    events.push({ type: 'DIALOGUE_TOPIC_CONSUMED', topicId: consumptionIdFor(state, topic) });
  }
  return events;
}
