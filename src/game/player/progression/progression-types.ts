export type ExpSourceKind = 'ENCOUNTER' | 'QUEST' | 'BOSS' | 'DISCOVERY' | 'CHAPTER' | 'ACTION';

export interface ExpGrant {
  amount: number;
  sourceEventId: string;
  reason: ExpSourceKind;
}
