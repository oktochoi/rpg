import type { Choice } from '@/game/story/choice';

export interface PlayerStatView {
  label: string;
  value: number;
}

export interface PlayerPanelView {
  name: string;
  job: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: readonly PlayerStatView[];
}

export interface StoryPanelView {
  npcName: string;
  npcDialogue: string;
  situation: string;
}

export interface QuestPanelView {
  title: string;
  status: string;
  summary: string;
}

export interface NpcRelationView {
  npcName: string;
  relation: string;
}

export interface StoryScreenView {
  title: string;
  locationName: string;
  day: number;
  player: PlayerPanelView;
  story: StoryPanelView;
  quest: QuestPanelView;
  relations: readonly NpcRelationView[];
  choices: readonly [Choice, Choice, Choice];
}
