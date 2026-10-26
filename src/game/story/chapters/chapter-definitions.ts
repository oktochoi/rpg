import { QUEST_ID } from '../../quests/quest-definitions';
import { CHAPTER_ID, type ChapterId, type StoryChapterDefinition } from './chapter-types';

export const STORY_CHAPTERS: Readonly<Record<ChapterId, StoryChapterDefinition>> = {
  [CHAPTER_ID.CHAPTER_1_LUEN_RUINS]: {
    id: CHAPTER_ID.CHAPTER_1_LUEN_RUINS,
    title: '제1장 — 폐허에서 깨어난 것',
    order: 1,
    description: '루엔 주변의 고블린 이상 이동을 추적하던 신참이, 왕실 봉인이 최근 훼손되었음을 알고 그 여파가 북문 너머까지 이어짐을 본다.',
    mainQuestIds: [QUEST_ID.RUINS_MYSTERY],
    nextChapterId: CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW,
    dramaticQuestion: '누가 루엔의 왕실 봉인을 최근에 건드렸는가?',
    mainReveal: '폐허는 왕실 봉인 시설이며, 누군가 플레이어보다 먼저 봉인을 훼손했다.',
    endHook: '북문 너머에서도 폐허와 같은 푸른 현상이 나타났고, 경비 초소와 연락이 끊겼다.',
  },
  [CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW]: {
    id: CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW,
    title: '제2장 — 북문의 그림자',
    order: 2,
    description: '북문 너머에서 이상한 움직임이 보고되기 시작한다.',
    mainQuestIds: [QUEST_ID.KNIGHT_SUSPICION],
    nextChapterId: CHAPTER_ID.CHAPTER_3_CAPITAL_RIFT,
    dramaticQuestion: '북쪽의 같은 현상은 누가 확산시키고 있는가?',
    mainReveal: '폐허의 푸른 마력과 동일한 맥동이 북쪽으로 퍼지고 있다.',
    endHook: '확산의 주체는 아직 보이지 않으며, 왕실과 현장의 보고가 엇갈리기 시작한다.',
  },
  [CHAPTER_ID.CHAPTER_3_CAPITAL_RIFT]: {
    id: CHAPTER_ID.CHAPTER_3_CAPITAL_RIFT,
    title: '제3장 — 왕도의 균열',
    order: 3,
    description: '왕실과 마법석의 비밀이 확대된다.',
    mainQuestIds: [],
    nextChapterId: CHAPTER_ID.CHAPTER_4_SEAL,
    dramaticQuestion: '왕실은 봉인을 지키기 위해 움직였는가, 감추기 위해 움직였는가?',
    mainReveal: '왕도와 변방 봉인 사이에 기록되지 않은 균열이 있다.',
    endHook: '봉인의 최종 목적과 훼손자의 정체는 아직 닫혀 있다.',
  },
  [CHAPTER_ID.CHAPTER_4_SEAL]: {
    id: CHAPTER_ID.CHAPTER_4_SEAL,
    title: '제4장 — 봉인의 진실',
    order: 4,
    description: '봉인의 진실과 2차 전직의 길이 열린다.',
    mainQuestIds: [],
    dramaticQuestion: '봉인이 지키고 있던 것은 무엇이었으며, 누가 그것을 원했는가?',
    mainReveal: '이번 작업에서는 최종 악역과 봉인의 정체를 확정하지 않는다.',
    endHook: '제1장의 미해결 질문이 왕도와 북쪽을 가로질러 남는다.',
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
