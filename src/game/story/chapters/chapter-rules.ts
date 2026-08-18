import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { getQuestDefinition, QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { WORLD_FLAG } from '../../world/locations/location-definitions';
import { worldFlag } from '../../world/locations/location-selectors';
import { getChapterDefinition } from './chapter-definitions';
import { CHAPTER_ID } from './chapter-types';

export function currentChapterId(state: Readonly<GameState>): string {
  return state.story.currentChapterId ?? CHAPTER_ID.CHAPTER_1_LUEN_RUINS;
}

export function isChapterCompleted(state: Readonly<GameState>, chapterId: string): boolean {
  return (state.story.completedChapterIds ?? []).includes(chapterId);
}

export function canCompleteChapter(state: Readonly<GameState>, chapterId: string): boolean {
  if (isChapterCompleted(state, chapterId)) {
    return false;
  }
  if (chapterId !== CHAPTER_ID.CHAPTER_1_LUEN_RUINS) {
    return false;
  }
  const quest = state.quests[QUEST_ID.RUINS_MYSTERY];
  return (
    quest?.status === QUEST_STATUS.COMPLETED &&
    worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) &&
    worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT) &&
    worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE) &&
    worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE) &&
    worldFlag(state, WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN)
  );
}

export function eventsForChapterComplete(state: Readonly<GameState>, chapterId: string): GameEvent[] {
  if (!canCompleteChapter(state, chapterId)) {
    return [];
  }
  const definition = getChapterDefinition(chapterId);
  const nextId = definition?.nextChapterId;
  const events: GameEvent[] = [
    { type: 'CHAPTER_COMPLETED', chapterId },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.NORTHERN_GATE_OPEN, value: true },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.CHAPTER_1_COMPLETE, value: true },
    {
      type: 'HISTORY_RECORDED',
      entry: {
        id: `history_chapter_${chapterId}`,
        day: state.world.day ?? 1,
        locationId: state.world.currentLocationId,
        summary: `${definition?.title ?? '장'}을 마쳤다.`,
        kind: 'CHAPTER',
      },
    },
  ];
  if (nextId) {
    events.push({ type: 'CHAPTER_STARTED', chapterId: nextId });
  }
  return events;
}

export function chapterProgress(state: Readonly<GameState>): { completed: number; total: number } {
  const chapter = getChapterDefinition(currentChapterId(state));
  const questId = chapter?.mainQuestIds[0];
  const quest = questId ? state.quests[questId] : undefined;
  const definition = questId ? getQuestDefinition(questId) : null;
  if (!quest || !definition) {
    return { completed: 0, total: 0 };
  }
  const required = definition.objectives.filter((item) => !item.optional);
  const completed = required.filter((item) => quest.objectiveProgress[item.id]?.completed === true).length;
  return { completed, total: required.length };
}
