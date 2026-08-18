export const STARTING_GOLD = 50;
export const INN_REST_COST = 10;

export interface RewardItem {
  itemId: string;
  quantity: number;
}

export interface RewardBundle {
  exp?: number;
  gold?: number;
  items?: readonly RewardItem[];
}

export type GoldReason =
  | 'QUEST'
  | 'ENCOUNTER'
  | 'BOSS'
  | 'STORY'
  | 'SELL'
  | 'BUY'
  | 'ENHANCE'
  | 'REST'
  | 'GIVE';
