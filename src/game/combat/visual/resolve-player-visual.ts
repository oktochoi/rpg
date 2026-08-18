import { CLASS_RANK_ID, getClassRank, PLAYER_CLASS_ID, resolvePlayerClassId } from '../../player/classes';

export const PLAYER_VISUAL_ID = {
  ADVENTURER: 'adventurer',
  SWORDSMAN: 'swordsman',
  MAGE: 'mage',
  ROGUE: 'rogue',
} as const;

export type PlayerVisualId = (typeof PLAYER_VISUAL_ID)[keyof typeof PLAYER_VISUAL_ID];

const RANK_TO_VISUAL: Record<string, PlayerVisualId> = {
  [CLASS_RANK_ID.ADVENTURER]: PLAYER_VISUAL_ID.ADVENTURER,
  [CLASS_RANK_ID.WARRIOR_BASE]: PLAYER_VISUAL_ID.SWORDSMAN,
  [CLASS_RANK_ID.WARRIOR_ADVANCED]: PLAYER_VISUAL_ID.SWORDSMAN,
  [CLASS_RANK_ID.WARRIOR_MASTER]: PLAYER_VISUAL_ID.SWORDSMAN,
  [CLASS_RANK_ID.MAGE_BASE]: PLAYER_VISUAL_ID.MAGE,
  [CLASS_RANK_ID.MAGE_ADVANCED]: PLAYER_VISUAL_ID.MAGE,
  [CLASS_RANK_ID.MAGE_MASTER]: PLAYER_VISUAL_ID.MAGE,
  [CLASS_RANK_ID.ROGUE_BASE]: PLAYER_VISUAL_ID.ROGUE,
  [CLASS_RANK_ID.ROGUE_ADVANCED]: PLAYER_VISUAL_ID.ROGUE,
  [CLASS_RANK_ID.ROGUE_MASTER]: PLAYER_VISUAL_ID.ROGUE,
};

const TOKEN_TO_VISUAL: ReadonlyArray<readonly [RegExp, PlayerVisualId]> = [
  [/(high[_-]?mage|archmage|\bmage\b)/i, PLAYER_VISUAL_ID.MAGE],
  [/(shadow[_-]?rogue|assassin(_master)?|\brogue\b)/i, PLAYER_VISUAL_ID.ROGUE],
  [/(high[_-]?swordsman|swordmaster|swordsman|\bwarrior\b)/i, PLAYER_VISUAL_ID.SWORDSMAN],
  [/(adventurer|wanderer)/i, PLAYER_VISUAL_ID.ADVENTURER],
];

function visualForFamily(familyId: string): PlayerVisualId | null {
  if (familyId === PLAYER_CLASS_ID.WARRIOR) {
    return PLAYER_VISUAL_ID.SWORDSMAN;
  }
  if (familyId === PLAYER_CLASS_ID.MAGE) {
    return PLAYER_VISUAL_ID.MAGE;
  }
  if (familyId === PLAYER_CLASS_ID.ROGUE) {
    return PLAYER_VISUAL_ID.ROGUE;
  }
  if (familyId === PLAYER_CLASS_ID.ADVENTURER) {
    return PLAYER_VISUAL_ID.ADVENTURER;
  }
  return null;
}

export function resolvePlayerVisualId(jobId: string, rankId?: string): PlayerVisualId {
  if (rankId && RANK_TO_VISUAL[rankId]) {
    return RANK_TO_VISUAL[rankId];
  }
  const rank = getClassRank(rankId);
  if (rank) {
    return visualForFamily(rank.familyId) ?? PLAYER_VISUAL_ID.ADVENTURER;
  }
  const token = `${jobId} ${rankId ?? ''}`;
  for (const [pattern, visualId] of TOKEN_TO_VISUAL) {
    if (pattern.test(token)) {
      return visualId;
    }
  }
  return visualForFamily(resolvePlayerClassId(jobId)) ?? PLAYER_VISUAL_ID.ADVENTURER;
}
