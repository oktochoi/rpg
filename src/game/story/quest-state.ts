import type { QuestId } from '../core/ids';

export type QuestStatus = 'inactive' | 'active' | 'completed' | 'failed';

export interface QuestState {
  id: QuestId;
  status: QuestStatus;
}
