export const CHAPTER_ID = {
  CHAPTER_1_LUEN_RUINS: 'CHAPTER_1_LUEN_RUINS',
  CHAPTER_2_NORTHERN_SHADOW: 'CHAPTER_2_NORTHERN_SHADOW',
  CHAPTER_3_CAPITAL_RIFT: 'CHAPTER_3_CAPITAL_RIFT',
  CHAPTER_4_SEAL: 'CHAPTER_4_SEAL',
} as const;

export type ChapterId = (typeof CHAPTER_ID)[keyof typeof CHAPTER_ID];

export interface StoryChapterDefinition {
  id: ChapterId;
  title: string;
  order: number;
  description: string;
  mainQuestIds: readonly string[];
  nextChapterId?: ChapterId;
}
