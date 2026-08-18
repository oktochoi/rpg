export const STAT_ID = {
  VIT: 'vit',
  STR: 'str',
  INT: 'int',
  AGI: 'agi',
} as const;

export type StatId = (typeof STAT_ID)[keyof typeof STAT_ID];

export const STAT_IDS: readonly StatId[] = [STAT_ID.VIT, STAT_ID.STR, STAT_ID.INT, STAT_ID.AGI];

export interface AllocatedStats {
  vit: number;
  str: number;
  int: number;
  agi: number;
}

export const EMPTY_ALLOCATED_STATS: AllocatedStats = {
  vit: 0,
  str: 0,
  int: 0,
  agi: 0,
};

export const STAT_LABEL: Readonly<Record<StatId, string>> = {
  vit: '체력',
  str: '힘',
  int: '지능',
  agi: '민첩',
};

export const STAT_DESCRIPTION: Readonly<Record<StatId, string>> = {
  vit: '최대 HP를 증가시킵니다.',
  str: '물리 공격력을 증가시킵니다.',
  int: '최대 MP와 마법 위력을 증가시킵니다.',
  agi: '공격력을 조금 증가시킵니다. 이동 속도는 바뀌지 않습니다.',
};

export const STAT_BONUS_PER_POINT = {
  vit: { maxHp: 10, maxMp: 0, attack: 0 },
  str: { maxHp: 0, maxMp: 0, attack: 2 },
  int: { maxHp: 0, maxMp: 8, attack: 1 },
  agi: { maxHp: 0, maxMp: 0, attack: 1 },
} as const;

export function emptyAllocatedStats(value?: Partial<AllocatedStats> | null): AllocatedStats {
  return {
    vit: Math.max(0, value?.vit ?? 0),
    str: Math.max(0, value?.str ?? 0),
    int: Math.max(0, value?.int ?? 0),
    agi: Math.max(0, value?.agi ?? 0),
  };
}

export function isStatId(value: string): value is StatId {
  return STAT_IDS.includes(value as StatId);
}
