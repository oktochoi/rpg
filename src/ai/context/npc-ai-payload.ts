import { AI_DIALOGUE_HISTORY_LIMIT } from '../config/ai-config';
import type { NpcAiPayload } from '../payloads';
import type { NpcDialogueContext } from '../../game/npc/dialogue-context';
import { attitudeFromRelationship } from '../../game/relationships/relationship-selectors';
import { playerFacingFactTopic } from '../../game/story/choices/choice-templates';
import { describeRelationshipMeaning } from './relationship-meaning';

export function buildNpcAiPayload(context: NpcDialogueContext): NpcAiPayload {
  const relationship = context.relationship;
  return {
    npc: {
      id: context.npc.id,
      name: context.npc.name,
      role: context.npc.role,
      personality: context.npc.personality,
      speakingStyle: context.npc.speakingStyle,
      values: context.npc.values,
      currentGoal: context.npc.currentGoal,
    },
    relationship: {
      affection: relationship.affection,
      trust: relationship.trust,
      fear: relationship.fear,
      respect: relationship.respect,
      attitude: attitudeFromRelationship(relationship),
      meaning: describeRelationshipMeaning(relationship),
    },
    knownFacts: context.knownFacts.map((fact) => ({
      id: fact.id,
      type: fact.type,
      topic: playerFacingFactTopic(fact.id, fact.type),
    })),
    memories: context.relevantMemories.map((memory) => ({
      id: memory.id,
      type: memory.type,
      summary: memory.summary,
      importance: memory.importance,
    })),
    locationId: context.currentLocationId,
    sceneId: context.currentSceneId,
    recentDialogue: (context.recentDialogue ?? []).slice(-AI_DIALOGUE_HISTORY_LIMIT).map((message) => ({
      speaker: message.speaker,
      text: message.text,
    })),
    relevantQuests: context.relevantQuestStates.map((quest) => ({
      id: quest.id,
      status: quest.status,
    })),
    playerSaid: context.playerInput ?? '',
    player: {
      name: context.playerName,
      level: context.playerLevel,
      classDisplay: context.playerClassDisplay,
      rank: context.playerRank,
    },
    world: {
      day: context.day,
      hour: context.hour,
      minute: context.minute,
      timeOfDay: context.timeOfDay,
      clock: context.clock,
    },
    story: {
      chapterTitle: context.currentChapterTitle,
      mainObjective: context.currentMainObjective,
    },
  };
}
