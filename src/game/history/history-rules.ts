import type { HistoryEntry } from './history-types';
import { MAX_HISTORY_ENTRIES } from './history-types';

export function withHistoryEntry(history: readonly HistoryEntry[] | undefined, entry: HistoryEntry): HistoryEntry[] {
  const current = history ?? [];
  if (current.some((item) => item.id === entry.id)) {
    return [...current];
  }
  return [...current, entry].slice(-MAX_HISTORY_ENTRIES);
}
