export const MINUTES_PER_DAY = 1440;
export const GAME_START_HOUR = 8;
export const GAME_START_MINUTE = 0;
export const REST_WAKE_HOUR = 8;

export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
export type TimeAdvanceReason = 'ACTION' | 'MOVE' | 'COMBAT' | 'REST' | 'STORY' | 'WAIT';

export function totalMinutesForDayMorning(day: number, hour = GAME_START_HOUR, minute = GAME_START_MINUTE): number {
  const safeDay = Math.max(1, day);
  return (safeDay - 1) * MINUTES_PER_DAY + hour * 60 + minute;
}

export function dayFromTotalMinutes(totalMinutes: number): number {
  return Math.floor(Math.max(0, totalMinutes) / MINUTES_PER_DAY) + 1;
}

export function hourFromTotalMinutes(totalMinutes: number): number {
  return Math.floor((Math.max(0, totalMinutes) % MINUTES_PER_DAY) / 60);
}

export function minuteFromTotalMinutes(totalMinutes: number): number {
  return Math.max(0, totalMinutes) % 60;
}

export function timeOfDayFromTotalMinutes(totalMinutes: number): TimeOfDay {
  const hour = hourFromTotalMinutes(totalMinutes);
  if (hour >= 5 && hour < 12) {
    return 'MORNING';
  }
  if (hour >= 12 && hour < 18) {
    return 'AFTERNOON';
  }
  if (hour >= 18 && hour < 22) {
    return 'EVENING';
  }
  return 'NIGHT';
}

export function formatClock(totalMinutes: number): string {
  const day = dayFromTotalMinutes(totalMinutes);
  const hour = hourFromTotalMinutes(totalMinutes);
  const minute = minuteFromTotalMinutes(totalMinutes);
  return `DAY ${day} · ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function nextMorningTotalMinutes(totalMinutes: number): number {
  const dayIndex = Math.floor(Math.max(0, totalMinutes) / MINUTES_PER_DAY);
  return (dayIndex + 1) * MINUTES_PER_DAY + REST_WAKE_HOUR * 60;
}
