import type { GameState } from '../../core/game-state';
import { doesPlayerKnowFact, getKnownFactsForNpc, getPlayerKnownFacts } from '../../knowledge/knowledge-selectors';
import { getMemoriesForNpc } from '../../npc/memory/memory-selectors';
import { createRelationship } from '../../npc/relationship';
import { getNpcProfile } from '../../npc/npc-profiles';
import { getQuestDefinition } from '../../quests/quest-definitions';
import { currentObjective, featuredQuest } from '../../quests/quest-selectors';
import { QUEST_STATUS } from '../../quests/quest-types';
import { isExplorationPointCompleted } from '../../world/exploration/exploration-service';
import { explorationPointsAt } from '../../world/exploration/exploration-definitions';
import { WORLD_FLAG } from '../../world/locations/location-definitions';
import { buildLocationContext, getCurrentLocationNpcs, worldFlag } from '../../world/locations/location-selectors';
import { activeEncounterIdsForLocation } from '../../combat/encounters/encounter-progress';
import type { StoryDirectorContext, DirectorNpcContext, DirectorQuestContext } from '../../../ai/director/director-types';
import { playerFacingFactTopic } from './choice-templates';
import { displayClassName } from '../../player/classes';
import { getChapterDefinition, currentChapterId, getMainObjectiveText } from '../chapters';
import { formatClock, hourFromTotalMinutes, minuteFromTotalMinutes, timeOfDayFromTotalMinutes } from '../../time/clock-types';

const RELEVANT_FLAGS = [
  WORLD_FLAG.RUINS_GOBLINS_DEFEATED,
  WORLD_FLAG.ROYAL_STONE_DISCOVERED,
  WORLD_FLAG.NORTHERN_GATE_OPEN,
  WORLD_FLAG.RUINS_COMBAT_LOST,
  WORLD_FLAG.RUINS_GUARDIAN_DEFEATED,
  WORLD_FLAG.RUINS_GUARDIAN_LOST,
  WORLD_FLAG.GUILD_REGISTERED,
  WORLD_FLAG.SHOP_UNLOCKED,
  WORLD_FLAG.ENHANCEMENT_UNLOCKED,
  WORLD_FLAG.FOREST_GOBLIN_DEFEATED,
  WORLD_FLAG.FOREST_AMBUSH_CLEARED,
  WORLD_FLAG.GOBLIN_CAMP_CLEARED,
  WORLD_FLAG.GUILD_RECOGNITION_DONE,
  WORLD_FLAG.FIRST_ADVANCEMENT_DONE,
] as const;

export function activeEncounterIdsForState(state: Readonly<GameState>): string[] {
  return activeEncounterIdsForLocation(state);
}

export function buildStoryDirectorContext(state: Readonly<GameState>): StoryDirectorContext {
  const location = buildLocationContext(state);
  if (!location) {
    throw new Error('현재 장소 정보를 만들 수 없습니다.');
  }

  const present = getCurrentLocationNpcs(state);
  const playerFacts = getPlayerKnownFacts(state).filter((fact) => {
    const topic = playerFacingFactTopic(fact.id, '');
    return topic.length > 0 || fact.locationId === state.world.currentLocationId;
  });

  const presentNpcs: DirectorNpcContext[] = present.flatMap((npc) => {
    const profile = getNpcProfile(npc.id);
    if (!profile) {
      return [];
    }
    const known = getKnownFactsForNpc(state, npc.id).map((fact) => fact.id);
    const memoryTypes = [...new Set(getMemoriesForNpc(state, npc.id).map((memory) => memory.type))];
    return [
      {
        npcId: npc.id,
        name: profile.name,
        role: profile.role,
        relationship: state.relationships[npc.id] ?? createRelationship(),
        relevantKnownFactIds: known,
        relevantMemoryTypes: memoryTypes,
        currentGoal: profile.currentGoal,
      },
    ];
  });

  const relevantQuests: DirectorQuestContext[] = Object.values(state.quests)
    .filter((quest) => quest.status === QUEST_STATUS.ACTIVE || quest.status === QUEST_STATUS.AVAILABLE)
    .map((quest) => {
      const definition = getQuestDefinition(quest.id);
      const current = definition ? currentObjective(quest, definition.objectives) : undefined;
      const featured = featuredQuest(state);
      if (featured && featured.id !== quest.id && quest.status !== QUEST_STATUS.ACTIVE) {
        return null;
      }
      return {
        questId: quest.id,
        title: definition?.title ?? quest.id,
        status: quest.status,
        currentObjectiveIds: current ? [current.id] : [],
        currentObjectiveDescriptions: current ? [current.description] : [],
      };
    })
    .filter((quest): quest is DirectorQuestContext => quest !== null);

  const unexplored = explorationPointsAt(state.world.currentLocationId)
    .filter((point) => !isExplorationPointCompleted(state, point.id))
    .map((point) => point.id);

  const flags = RELEVANT_FLAGS.filter((flagId) => worldFlag(state, flagId));

  return {
    turnId: state.world.turn,
    currentSceneId: state.story.currentSceneId,
    currentLocation: location,
    player: {
      classId: state.player.classId,
      name: state.player.name,
      level: state.player.level ?? 1,
      classDisplay: displayClassName(state.player.classId, state.player.classRankId),
      rank: displayClassName(state.player.classId, state.player.classRankId),
      currentHp: state.player.currentHp,
      maxHp: state.player.maxHp,
      currentMp: state.player.currentMp,
      maxMp: state.player.maxMp,
    },
    presentNpcs,
    relevantQuests,
    relevantPlayerKnownFacts: playerFacts,
    relevantWorldFlags: flags,
    availableExplorationPoints: unexplored,
    availableEncounterIds: activeEncounterIdsForState(state),
    day: state.world.day ?? 1,
    hour: hourFromTotalMinutes(state.world.totalMinutes ?? 0),
    minute: minuteFromTotalMinutes(state.world.totalMinutes ?? 0),
    timeOfDay: timeOfDayFromTotalMinutes(state.world.totalMinutes ?? 0),
    clock: formatClock(state.world.totalMinutes ?? 0),
    chapterTitle: getChapterDefinition(currentChapterId(state))?.title,
    mainObjective: getMainObjectiveText(state),
  };
}

export function choiceRefreshKey(state: Readonly<GameState>): string {
  const npcs = getCurrentLocationNpcs(state)
    .map((npc) => {
      const rel = state.relationships[npc.id];
      const facts = npc.knowledge.entries.map((entry) => entry.factId).join(',');
      const memories = (state.npcMemories[npc.id] ?? []).map((memory) => memory.type).join(',');
      return `${npc.id}:${npc.locationId}:${rel?.trust ?? 0}:${rel?.fear ?? 0}:${facts}:${memories}`;
    })
    .join('|');
  const quests = Object.values(state.quests)
    .map((quest) => {
      const progress = Object.values(quest.objectiveProgress)
        .map((item) => `${item.objectiveId}:${item.completed ? 1 : 0}`)
        .join(',');
      return `${quest.id}:${quest.status}:${progress}`;
    })
    .join('|');
  return [
    state.mode,
    state.world.turn,
    state.story.currentSceneId,
    state.world.currentLocationId,
    state.player.classId,
    state.knowledge.knownFactIds.join(','),
    state.world.exploredPointIds.join(','),
    Object.entries(state.world.flags)
      .filter(([, value]) => value)
      .map(([id]) => id)
      .join(','),
    quests,
    npcs,
  ].join('::');
}
