import {
  displayClassName,
  nextAdvancementsFor,
  getClassRank,
  resolvePlayerClassId,
  canChooseFirstAdvancement,
  isAdventurer,
} from '../player/classes';
import type { GameState } from '../core/game-state';
import type { NpcId } from '../core/ids';
import type { NpcRelationView, StoryScreenView } from '../../components/story/types';
import type { Choice } from './choice';
import { getNpcProfile } from '../npc/npc-profiles';
import { createRelationship, type RelationshipState } from '../npc/relationship';
import { relationshipBandLabel } from '../relationships/relationship-selectors';
import { getStoryScene } from './test-scenes';
import { getQuestDefinition } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { currentObjective, featuredQuest, statusLabel } from '../quests/quest-selectors';
import { getAvailableChoices } from './story-choice-service';
import { getCurrentScene } from './story-scene-resolver';
import { allStorySceneDefinitions } from './story-scene-definitions';
import { getLocationDefinition } from '../world/locations/location-definitions';
import { getLocationDescription } from '../world/locations/location-selectors';
import { expRequiredForLevel } from '../player/progression/level-config';
import { chapterProgress, currentChapterId, getChapterDefinition, getMainObjectiveText, getNextStepText } from './chapters';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { formatClock, timeOfDayFromTotalMinutes } from '../time/clock-types';
import { getSequenceDefinition, getStoryFlowMode } from './sequences';
import { getGamePhase } from './game-phase';

function visibleSituation(state: Readonly<GameState>): string {
  return state.story.narration || getLocationDescription(state.world.currentLocationId, state);
}

function jobLabel(classId: string, rankId?: string): string {
  return displayClassName(classId, rankId);
}

function normalizeLine(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/** A line written for a different scene should not keep playing after the player leaves. */
function lineBelongsToAnotherScene(text: string, currentSceneId: string): boolean {
  const normalized = normalizeLine(text);
  if (!normalized) {
    return false;
  }
  return allStorySceneDefinitions().some(
    (scene) => scene.id !== currentSceneId && normalizeLine(scene.npcDialogue) === normalized
  );
}

function openingLine(sceneDialogue: string): string {
  return sceneDialogue;
}

function toRelationView(npcName: string, _npcId: NpcId, relationship: RelationshipState | undefined): NpcRelationView {
  const value = relationship ?? createRelationship();
  return {
    npcName,
    relation: relationshipBandLabel(value),
    affection: value.affection,
    trust: value.trust,
    fear: value.fear,
    respect: value.respect,
  };
}

export function toStoryScreenView(
  state: Readonly<GameState>,
  dynamicChoices?: readonly Choice[],
  options?: { npcEmotion?: string | null }
): StoryScreenView {
  const sceneDefinition = getCurrentScene(state);
  const scene = getStoryScene(state.story.currentSceneId);
  const sceneNpcId = sceneDefinition?.npcId ?? null;
  const npcHere =
    state.story.currentNpcId != null &&
    state.npcs[state.story.currentNpcId]?.locationId === state.world.currentLocationId;
  const npcId = sceneNpcId ?? (npcHere ? state.story.currentNpcId : null);
  const profile = npcId ? getNpcProfile(npcId) : null;
  const authoredLine = normalizeLine(sceneDefinition?.npcDialogue ?? scene.npcDialogue);
  const lastNpcLine = [...state.story.dialogue].reverse().find((message) => message.speaker === 'NPC');
  const staleEventLine =
    !npcId || (lastNpcLine ? lineBelongsToAnotherScene(lastNpcLine.text, state.story.currentSceneId) : false);
  const dialogue = staleEventLine ? [] : state.story.dialogue;
  const questRuntime = featuredQuest(state);
  const questDefinition = questRuntime ? getQuestDefinition(questRuntime.id) : null;
  const current =
    questRuntime?.status === QUEST_STATUS.ACTIVE && questDefinition
      ? currentObjective(questRuntime, questDefinition.objectives)
      : undefined;
  const chapter = getChapterDefinition(currentChapterId(state));
  const progress = chapterProgress(state);
  const level = state.player.level ?? 1;
  const exp = state.player.exp ?? 0;
  const expToNext = expRequiredForLevel(level);
  const classId = resolvePlayerClassId(state.player.classId);
  const nextList = nextAdvancementsFor(classId, state.player.classRankId);
  const derived = derivedPlayerStats(state.player);
  const attack = derived.attackPower;
  const canAdvance = canChooseFirstAdvancement(state);
  const isStillAdventurer = isAdventurer(state.player.classId);
  const nextRankLabel = canAdvance
    ? '검사 / 마법사 / 도적'
    : isStillAdventurer
      ? undefined
      : nextList.length > 1
        ? nextList.map((item) => getClassRank(item.toRank)?.name ?? item.toRank).join(' / ')
        : nextList[0]
          ? getClassRank(nextList[0].toRank)?.name ?? displayClassName(nextList[0].familyId, nextList[0].toRank)
          : undefined;
  const nextRankHint = canAdvance
    ? '길드에서 전직 가능'
    : isStillAdventurer
      ? '제1장을 마친 뒤 전직'
      : nextList[0]
        ? nextList.length > 1
          ? `Lv.${nextList[0].levelRequirement} + 제1장 완료`
          : `Lv.${nextList[0].levelRequirement} · 전직 퀘스트`
        : undefined;

  const choices = dynamicChoices ?? getAvailableChoices(state);
  const suggestedNextAction = getNextStepText(state);

  return {
    title: chapter?.title ?? '잿빛 연대기',
    locationId: state.world.currentLocationId,
    locationName: getLocationDefinition(state.world.currentLocationId)?.name ?? '알 수 없는 곳',
    day: state.world.day ?? 1,
    clock: formatClock(state.world.totalMinutes ?? 0),
    timeOfDay: timeOfDayFromTotalMinutes(state.world.totalMinutes ?? 0),
    turnId: state.world.turn,
    chapterTitle: chapter?.title ?? '제1장',
    chapterProgressLabel: progress.total > 0 ? `${progress.completed} / ${progress.total} 주요 목표` : undefined,
    mainObjective: getMainObjectiveText(state),
    placeLine: getLocationDefinition(state.world.currentLocationId)?.description,
    suggestedNextAction,
    player: {
      name: state.player.name,
      job: jobLabel(state.player.classId, state.player.classRankId),
      level,
      exp,
      expToNext,
      rank: jobLabel(state.player.classId, state.player.classRankId),
      nextRank: nextRankLabel,
      nextRankHint,
      hp: state.player.currentHp,
      maxHp: derived.maxHp,
      mp: state.player.currentMp,
      maxMp: derived.maxMp,
      attack,
      gold: state.player.gold,
      unspentStatPoints: state.player.unspentStatPoints ?? 0,
      stats: [
        { label: 'HP', value: derived.maxHp },
        { label: 'MP', value: derived.maxMp },
        { label: '공격', value: attack },
        { label: '골드', value: state.player.gold },
      ],
    },
    story: {
      npcId: npcId ?? '',
      npcName: npcId ? profile?.name ?? scene.npcName : '',
      npcRole: profile?.role ?? null,
      npcEmotion: options?.npcEmotion ?? 'neutral',
      npcDialogue: npcId ? (!staleEventLine ? lastNpcLine?.text : '') || openingLine(authoredLine) : '',
      situation: visibleSituation(state),
      lastActionNarrative: state.story.lastActionNarrative,
      messages: dialogue,
      storyLog: (state.story.storyLog ?? []).map((entry) => ({
        id: entry.id,
        type: entry.type,
        text: entry.text,
        speaker: entry.type === 'dialogue' ? entry.speaker : undefined,
      })),
      flowMode: getStoryFlowMode(state),
      gamePhase: getGamePhase(state),
      sequenceTitle: getSequenceDefinition(state.story.currentSequenceId)?.title ?? null,
    },
    quest: questRuntime && questDefinition
      ? {
          title: questDefinition.title,
          status: statusLabel(questRuntime.status),
          summary: questDefinition.description,
          currentObjective: current?.description ?? getMainObjectiveText(state),
          objectives: questDefinition.objectives.map((objective) => ({
            id: objective.id,
            description: objective.description,
            completed: questRuntime.objectiveProgress[objective.id]?.completed === true,
          })),
        }
      : {
          title: chapter?.title ?? '진행 중인 의뢰 없음',
          status: '대기',
          summary: getMainObjectiveText(state),
          currentObjective: getMainObjectiveText(state),
          objectives: [],
        },
    relations: [
      toRelationView('세리아', 'seria', state.relationships.seria),
      toRelationView('레온', 'leon', state.relationships.leon),
      toRelationView('마르타', 'innkeeper', state.relationships.innkeeper),
      toRelationView('도란', 'guildmaster_doran', state.relationships.guildmaster_doran),
      toRelationView('엘린', 'shopkeeper_elin', state.relationships.shopkeeper_elin),
    ],
    choices: choices,
  };
}
