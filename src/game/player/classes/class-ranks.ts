import { PLAYER_CLASS_ID, type PlayerClassId } from './class-types';

export const CLASS_RANK_ID = {
  ADVENTURER: 'adventurer_base',
  WARRIOR_BASE: 'warrior_swordsman',
  WARRIOR_ADVANCED: 'warrior_high_swordsman',
  WARRIOR_MASTER: 'warrior_swordmaster',
  MAGE_BASE: 'mage_mage',
  MAGE_ADVANCED: 'mage_high_mage',
  MAGE_MASTER: 'mage_archmage',
  ROGUE_BASE: 'rogue_rogue',
  ROGUE_ADVANCED: 'rogue_shadow',
  ROGUE_MASTER: 'rogue_assassin',
} as const;

export type ClassRankId = (typeof CLASS_RANK_ID)[keyof typeof CLASS_RANK_ID];

export interface ClassRankDefinition {
  id: ClassRankId;
  familyId: PlayerClassId;
  order: 0 | 1 | 2;
  name: string;
}

export const CLASS_RANKS: Readonly<Record<ClassRankId, ClassRankDefinition>> = {
  [CLASS_RANK_ID.ADVENTURER]: {
    id: CLASS_RANK_ID.ADVENTURER,
    familyId: PLAYER_CLASS_ID.ADVENTURER,
    order: 0,
    name: '모험가',
  },
  [CLASS_RANK_ID.WARRIOR_BASE]: {
    id: CLASS_RANK_ID.WARRIOR_BASE,
    familyId: PLAYER_CLASS_ID.WARRIOR,
    order: 0,
    name: '검사',
  },
  [CLASS_RANK_ID.WARRIOR_ADVANCED]: {
    id: CLASS_RANK_ID.WARRIOR_ADVANCED,
    familyId: PLAYER_CLASS_ID.WARRIOR,
    order: 1,
    name: '상급 검사',
  },
  [CLASS_RANK_ID.WARRIOR_MASTER]: {
    id: CLASS_RANK_ID.WARRIOR_MASTER,
    familyId: PLAYER_CLASS_ID.WARRIOR,
    order: 2,
    name: '소드마스터',
  },
  [CLASS_RANK_ID.MAGE_BASE]: {
    id: CLASS_RANK_ID.MAGE_BASE,
    familyId: PLAYER_CLASS_ID.MAGE,
    order: 0,
    name: '마법사',
  },
  [CLASS_RANK_ID.MAGE_ADVANCED]: {
    id: CLASS_RANK_ID.MAGE_ADVANCED,
    familyId: PLAYER_CLASS_ID.MAGE,
    order: 1,
    name: '상급 마법사',
  },
  [CLASS_RANK_ID.MAGE_MASTER]: {
    id: CLASS_RANK_ID.MAGE_MASTER,
    familyId: PLAYER_CLASS_ID.MAGE,
    order: 2,
    name: '대마법사',
  },
  [CLASS_RANK_ID.ROGUE_BASE]: {
    id: CLASS_RANK_ID.ROGUE_BASE,
    familyId: PLAYER_CLASS_ID.ROGUE,
    order: 0,
    name: '도적',
  },
  [CLASS_RANK_ID.ROGUE_ADVANCED]: {
    id: CLASS_RANK_ID.ROGUE_ADVANCED,
    familyId: PLAYER_CLASS_ID.ROGUE,
    order: 1,
    name: '그림자 도적',
  },
  [CLASS_RANK_ID.ROGUE_MASTER]: {
    id: CLASS_RANK_ID.ROGUE_MASTER,
    familyId: PLAYER_CLASS_ID.ROGUE,
    order: 2,
    name: '암살의 달인',
  },
};

export function baseRankIdForClass(classId: string): ClassRankId | null {
  if (classId === PLAYER_CLASS_ID.ADVENTURER) {
    return CLASS_RANK_ID.ADVENTURER;
  }
  if (classId === PLAYER_CLASS_ID.WARRIOR) {
    return CLASS_RANK_ID.WARRIOR_BASE;
  }
  if (classId === PLAYER_CLASS_ID.MAGE) {
    return CLASS_RANK_ID.MAGE_BASE;
  }
  if (classId === PLAYER_CLASS_ID.ROGUE) {
    return CLASS_RANK_ID.ROGUE_BASE;
  }
  return null;
}

export function getClassRank(rankId: string | undefined): ClassRankDefinition | null {
  if (!rankId) {
    return null;
  }
  return CLASS_RANKS[rankId as ClassRankId] ?? null;
}

export function ranksForFamily(familyId: PlayerClassId): ClassRankDefinition[] {
  return Object.values(CLASS_RANKS)
    .filter((rank) => rank.familyId === familyId)
    .sort((a, b) => a.order - b.order);
}

export function displayClassName(classId: string, rankId?: string): string {
  const rank = getClassRank(rankId);
  if (rank) {
    return rank.name;
  }
  if (classId === PLAYER_CLASS_ID.ADVENTURER || classId === 'wanderer') {
    return '모험가';
  }
  if (classId === PLAYER_CLASS_ID.WARRIOR) {
    return '검사';
  }
  if (classId === PLAYER_CLASS_ID.MAGE) {
    return '마법사';
  }
  if (classId === PLAYER_CLASS_ID.ROGUE) {
    return '도적';
  }
  return '모험가';
}
