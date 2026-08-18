import type { ChoiceSource } from './choice-types';
import { CHOICE_SOURCE } from './choice-types';

import { isGameDebugEnabled } from '../../debug/debug-flags';

export const CHOICE_PRIORITY = {
  QUEST_CRITICAL: 100,
  STORY_CRITICAL: 95,
  STORY: 90,
  KNOWLEDGE: 85,
  NPC_IMPORTANT: 80,
  EXPLORATION: 75,
  COMBAT: 70,
  CLASS: 65,
  RELATIONSHIP: 60,
  MEMORY: 60,
  MOVE: 50,
  GENERAL: 20,
} as const;

export const DIRECTOR_MAX_CHOICES = 3;

export const DIRECTOR_CHOICE_DEBUG = false;

export function directorChoiceDebugEnabled(): boolean {
  return isGameDebugEnabled();
}

export const SOURCE_RANK: Readonly<Record<ChoiceSource, number>> = {
  [CHOICE_SOURCE.QUEST]: 0,
  [CHOICE_SOURCE.STORY]: 1,
  [CHOICE_SOURCE.KNOWLEDGE]: 2,
  [CHOICE_SOURCE.NPC]: 3,
  [CHOICE_SOURCE.COMBAT]: 4,
  [CHOICE_SOURCE.EXPLORATION]: 5,
  [CHOICE_SOURCE.CLASS]: 6,
  [CHOICE_SOURCE.RELATIONSHIP]: 7,
  [CHOICE_SOURCE.MEMORY]: 8,
  [CHOICE_SOURCE.MOVE]: 9,
  [CHOICE_SOURCE.GENERAL]: 10,
};

export function sourceRank(source: ChoiceSource): number {
  return SOURCE_RANK[source];
}
