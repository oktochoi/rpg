import { displayClassName, nextAdvancementsFor, getClassRank, resolvePlayerClassId, canChooseFirstAdvancement } from '../player/classes';
import type { GameState } from '../core/game-state';
import type { NpcId } from '../core/ids';
import type { NpcRelationView, StoryScreenView } from '../../components/story/types';
import type { Choice } from './choice';
import { getNpcProfile } from '../npc/npc-profiles';
import { createRelationship, type RelationshipState } from '../npc/relationship';
import { relationshipBandLabel } from '../relationships/relationship-selectors';
import { getStoryScene } from './test-scenes';
import { getQuestDefinition } from '../quests/quest-definitions';
import { currentObjective, featuredQuest, statusLabel } from '../quests/quest-selectors';
import { getAvailableChoices } from './story-choice-service';
import { getCurrentScene } from './story-scene-resolver';
import { getLocationDefinition } from '../world/locations/location-definitions';
import { getLocationDescription } from '../world/locations/location-selectors';
import { expRequiredForLevel } from '../player/progression/level-config';
import { chapterProgress, currentChapterId, getChapterDefinition, getMainObjectiveText } from './chapters';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { formatClock, timeOfDayFromTotalMinutes } from '../time/clock-types';

function jobLabel(classId: string, rankId?: string): string {
  return displayClassName(classId, rankId);
}

function openingLine(npcId: NpcId, sceneDialogue: string): string {
  if (npcId === 'leon') {
    return '용건을 말하게.';
  }
  if (npcId === 'innkeeper') {
    return '어서 오게. 무슨 일이야?';
  }
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
  const npcId = state.story.currentNpcId ?? sceneDefinition?.npcId ?? 'seria';
  const profile = getNpcProfile(npcId);
  const lastNpcLine = [...state.story.dialogue].reverse().find((message) => message.speaker === 'NPC');
  const questRuntime = featuredQuest(state);
  const questDefinition = questRuntime ? getQuestDefinition(questRuntime.id) : null;
  const current = questRuntime && questDefinition ? currentObjective(questRuntime, questDefinition.objectives) : undefined;
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
  const nextRankLabel = canAdvance
    ? '검사 / 마법사 / 도적'
    : nextList.length > 1
      ? nextList.map((item) => getClassRank(item.toRank)?.name ?? item.toRank).join(' / ')
      : nextList[0]
        ? getClassRank(nextList[0].toRank)?.name ?? displayClassName(nextList[0].familyId, nextList[0].toRank)
        : undefined;
  const nextRankHint = canAdvance
    ? '지금 선택 가능'
    : nextList[0]
      ? nextList.length > 1
        ? `Lv.${nextList[0].levelRequirement} + 제1장 완료`
        : `Lv.${nextList[0].levelRequirement} · 전직 퀘스트`
      : undefined;

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
      npcId,
      npcName: profile?.name ?? scene.npcName,
      npcRole: profile?.role ?? null,
      npcEmotion: options?.npcEmotion ?? 'neutral',
      npcDialogue: lastNpcLine?.text ?? openingLine(npcId, sceneDefinition?.npcDialogue ?? scene.npcDialogue),
      situation: state.story.narration || getLocationDescription(state.world.currentLocationId, state),
      lastActionNarrative: state.story.lastActionNarrative,
      messages: state.story.dialogue,
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
    choices: dynamicChoices ?? getAvailableChoices(state),
  };
}
