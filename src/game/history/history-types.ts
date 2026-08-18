export type HistoryKind = 'ARRIVAL' | 'QUEST' | 'COMBAT' | 'DISCOVERY' | 'CHAPTER' | 'REST' | 'LEVEL' | 'NPC' | 'JOB';

export interface HistoryEntry {
  id: string;
  day: number;
  totalMinutes?: number;
  clock?: string;
  locationId?: string;
  summary: string;
  kind: HistoryKind;
}

export const MAX_HISTORY_ENTRIES = 80;
