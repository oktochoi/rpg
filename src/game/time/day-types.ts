export type DayAdvanceReason = 'REST' | 'CHAPTER' | 'STORY';

export interface DayAdvancePayload {
  fromDay: number;
  toDay: number;
  reason: DayAdvanceReason;
}
