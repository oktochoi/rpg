import { QUEST_ID } from '../../quests/quest-definitions';
import { CHAPTER_ID, type ChapterId, type StoryChapterDefinition } from './chapter-types';

export const STORY_CHAPTERS: Readonly<Record<ChapterId, StoryChapterDefinition>> = {
  [CHAPTER_ID.CHAPTER_1_LUEN_RUINS]: {
    id: CHAPTER_ID.CHAPTER_1_LUEN_RUINS,
    title: '제1장 — 폐허에서 깨어난 것',
    order: 1,
    description: '루엔 변방의 폐허에서 왕실의 문장이 새겨진 마법석이 발견된다.',
    mainQuestIds: [QUEST_ID.RUINS_MYSTERY],
    nextChapterId: CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW,
  },
  [CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW]: {
    id: CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW,
    title: '제2장 — 북문의 그림자',
    order: 2,
    description: '북문 너머에서 이상한 움직임이 보고되기 시작한다.',
    mainQuestIds: [QUEST_ID.KNIGHT_SUSPICION],
    nextChapterId: CHAPTER_ID.CHAPTER_3_CAPITAL_RIFT,
  },
  [CHAPTER_ID.CHAPTER_3_CAPITAL_RIFT]: {
    id: CHAPTER_ID.CHAPTER_3_CAPITAL_RIFT,
    title: '제3장 — 왕도의 균열',
    order: 3,
    description: '왕실과 마법석의 비밀이 확대된다.',
    mainQuestIds: [],
    nextChapterId: CHAPTER_ID.CHAPTER_4_SEAL,
  },
  [CHAPTER_ID.CHAPTER_4_SEAL]: {
    id: CHAPTER_ID.CHAPTER_4_SEAL,
    title: '제4장 — 봉인의 진실',
    order: 4,
    description: '봉인의 진실과 2차 전직의 길이 열린다.',
    mainQuestIds: [],
  },
};

export function getChapterDefinition(chapterId: string | undefined): StoryChapterDefinition | null {
  if (!chapterId) {
    return null;
  }
  return STORY_CHAPTERS[chapterId as ChapterId] ?? null;
}

export function allChapters(): StoryChapterDefinition[] {
  return Object.values(STORY_CHAPTERS).sort((a, b) => a.order - b.order);
}
