import type { ChoiceCandidate } from '../../game/story/choices/choice-types';
import { playerFacingFactTopic } from '../../game/story/choices/choice-templates';
import type { StoryDirectorContext } from '../director/director-types';
import type { DirectorAiPayload } from '../payloads';

export function buildDirectorAiPayload(
  context: StoryDirectorContext,
  candidates: readonly ChoiceCandidate[]
): DirectorAiPayload {
  return {
    turnId: context.turnId,
    sceneId: context.currentSceneId,
    location: {
      id: context.currentLocation.currentLocation.id,
      name: context.currentLocation.currentLocation.name,
    },
    playerClass: context.player.classDisplay ?? context.player.classId,
    playerName: context.player.name,
    playerLevel: context.player.level,
    playerRank: context.player.rank,
    day: context.day,
    hour: context.hour,
    minute: context.minute,
    timeOfDay: context.timeOfDay,
    clock: context.clock,
    chapterTitle: context.chapterTitle,
    mainObjective: context.mainObjective,
    presentNpcs: context.presentNpcs.map((npc) => ({ id: npc.npcId, name: npc.name })),
    quests: context.relevantQuests.map((quest) => ({
      title: quest.title,
      objective: quest.currentObjectiveDescriptions[0] ?? '',
    })),
    playerKnownFactTopics: context.relevantPlayerKnownFacts.map((fact) => playerFacingFactTopic(fact.id, fact.type)),
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      intent: candidate.intent,
      source: candidate.source,
      description: candidate.textTemplate,
      critical: candidate.critical,
    })),
  };
}
