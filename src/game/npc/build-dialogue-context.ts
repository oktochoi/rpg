import { AI_DIALOGUE_HISTORY_LIMIT } from '../../ai/config/ai-config';
import type { GameState } from '../core/game-state';
import type { NpcId } from '../core/ids';
import { getKnownFactsForNpc } from '../knowledge/knowledge-selectors';
import { getRelevantMemoriesForNpc } from './memory/memory-selectors';
import { createRelationship } from './relationship';
import type { NpcDialogueContext } from './dialogue-context';
import { getNpcProfile } from './npc-profiles';
import { activeQuestIds, completedQuestIds, relevantQuestStates } from '../quests/quest-selectors';
import { displayClassName } from '../player/classes';
import { getMainObjectiveText, getChapterDefinition, currentChapterId } from '../story/chapters';
import { formatClock, hourFromTotalMinutes, minuteFromTotalMinutes, timeOfDayFromTotalMinutes } from '../time/clock-types';

export function buildNpcDialogueContext(
  state: Readonly<GameState>,
  npcId: NpcId,
  playerInput: string
): NpcDialogueContext | null {
  const profile = getNpcProfile(npcId);
  const npc = state.npcs[npcId];
  if (!profile || !npc) {
    return null;
  }

  return {
    npc: profile,
    relationship: state.relationships[npcId] ?? createRelationship(),
    knownFacts: getKnownFactsForNpc(state, npcId),
    knowledgeEntries: npc.knowledge.entries,
    relevantMemories: getRelevantMemoriesForNpc(state, npcId, {
      playerInput,
      locationId: state.world.currentLocationId,
    }),
    currentLocationId: state.world.currentLocationId,
    currentSceneId: state.story.currentSceneId,
    currentNpcId: npcId,
    playerInput,
    recentDialogue: state.story.dialogue.slice(-AI_DIALOGUE_HISTORY_LIMIT),
    activeQuestIds: activeQuestIds(state),
    completedQuestIds: completedQuestIds(state),
    relevantQuestStates: relevantQuestStates(state, npcId),
    playerName: state.player.name,
    playerLevel: state.player.level ?? 1,
    playerClassDisplay: displayClassName(state.player.classId, state.player.classRankId),
    playerRank: displayClassName(state.player.classId, state.player.classRankId),
    day: state.world.day ?? 1,
    hour: hourFromTotalMinutes(state.world.totalMinutes ?? 0),
    minute: minuteFromTotalMinutes(state.world.totalMinutes ?? 0),
    timeOfDay: timeOfDayFromTotalMinutes(state.world.totalMinutes ?? 0),
    clock: formatClock(state.world.totalMinutes ?? 0),
    currentChapterTitle: getChapterDefinition(currentChapterId(state))?.title,
    currentMainObjective: getMainObjectiveText(state),
  };
}
