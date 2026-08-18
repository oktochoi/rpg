import type { Choice } from '@/game/story/choice';

export interface PlayerStatView {
  label: string;
  value: number;
}

export interface PlayerPanelView {
  name: string;
  job: string;
  level: number;
  exp?: number;
  expToNext?: number;
  rank?: string;
  nextRank?: string;
  nextRankHint?: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack?: number;
  gold?: number;
  unspentStatPoints?: number;
  stats: readonly PlayerStatView[];
}

export interface DialogueTurnView {
  speaker: 'PLAYER' | 'NPC';
  text: string;
}

export interface StoryPanelView {
  npcId: string;
  npcName: string;
  npcRole?: string | null;
  npcEmotion?: string | null;
  npcDialogue: string;
  situation: string;
  lastActionNarrative: string | null;
  messages: readonly DialogueTurnView[];
}

export interface QuestObjectiveView {
  id: string;
  description: string;
  completed: boolean;
}

export interface QuestPanelView {
  title: string;
  status: string;
  summary: string;
  currentObjective?: string;
  objectives: readonly QuestObjectiveView[];
}

export interface NpcRelationView {
  npcName: string;
  relation: string;
  affection: number;
  trust: number;
  fear: number;
  respect: number;
}

export interface StoryScreenView {
  title: string;
  locationId: string;
  locationName: string;
  day: number;
  clock?: string;
  timeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  turnId: number;
  chapterTitle?: string;
  chapterProgressLabel?: string;
  mainObjective?: string;
  player: PlayerPanelView;
  story: StoryPanelView;
  quest: QuestPanelView;
  relations: readonly NpcRelationView[];
  choices: readonly Choice[];
}
