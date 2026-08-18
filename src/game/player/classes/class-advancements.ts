import { PLAYER_CLASS_ID, type PlayerClassId } from './class-types';
import { CLASS_RANK_ID, type ClassRankId } from './class-ranks';
import { CHAPTER_ID } from '../../story/chapters/chapter-types';

export interface ClassAdvancementDefinition {
  id: string;
  familyId: PlayerClassId;
  fromRank: ClassRankId;
  toRank: ClassRankId;
  levelRequirement: number;
  chapterRequirement?: string;
  questRequirement?: string;
  statBonuses: { hp: number; mp: number; attack: number };
  unlockSkillIds: readonly string[];
}

export const CLASS_ADVANCEMENTS: readonly ClassAdvancementDefinition[] = [
  {
    id: 'adventurer_to_warrior',
    familyId: PLAYER_CLASS_ID.ADVENTURER,
    fromRank: CLASS_RANK_ID.ADVENTURER,
    toRank: CLASS_RANK_ID.WARRIOR_BASE,
    levelRequirement: 5,
    chapterRequirement: CHAPTER_ID.CHAPTER_1_LUEN_RUINS,
    questRequirement: 'first_advancement',
    statBonuses: { hp: 12, mp: 0, attack: 6 },
    unlockSkillIds: ['warrior_charge_slash', 'warrior_guard'],
  },
  {
    id: 'adventurer_to_mage',
    familyId: PLAYER_CLASS_ID.ADVENTURER,
    fromRank: CLASS_RANK_ID.ADVENTURER,
    toRank: CLASS_RANK_ID.MAGE_BASE,
    levelRequirement: 5,
    chapterRequirement: CHAPTER_ID.CHAPTER_1_LUEN_RUINS,
    questRequirement: 'first_advancement',
    statBonuses: { hp: 0, mp: 20, attack: 4 },
    unlockSkillIds: ['mage_fireball', 'mage_frost_nova'],
  },
  {
    id: 'adventurer_to_rogue',
    familyId: PLAYER_CLASS_ID.ADVENTURER,
    fromRank: CLASS_RANK_ID.ADVENTURER,
    toRank: CLASS_RANK_ID.ROGUE_BASE,
    levelRequirement: 5,
    chapterRequirement: CHAPTER_ID.CHAPTER_1_LUEN_RUINS,
    questRequirement: 'first_advancement',
    statBonuses: { hp: 6, mp: 8, attack: 5 },
    unlockSkillIds: ['rogue_shadow_dash', 'rogue_backstab'],
  },
  {
    id: 'warrior_to_high',
    familyId: PLAYER_CLASS_ID.WARRIOR,
    fromRank: CLASS_RANK_ID.WARRIOR_BASE,
    toRank: CLASS_RANK_ID.WARRIOR_ADVANCED,
    levelRequirement: 10,
    chapterRequirement: CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW,
    questRequirement: 'warrior_advancement_1',
    statBonuses: { hp: 20, mp: 5, attack: 6 },
    unlockSkillIds: [],
  },
  {
    id: 'warrior_to_master',
    familyId: PLAYER_CLASS_ID.WARRIOR,
    fromRank: CLASS_RANK_ID.WARRIOR_ADVANCED,
    toRank: CLASS_RANK_ID.WARRIOR_MASTER,
    levelRequirement: 20,
    chapterRequirement: CHAPTER_ID.CHAPTER_4_SEAL,
    questRequirement: 'warrior_advancement_2',
    statBonuses: { hp: 30, mp: 8, attack: 10 },
    unlockSkillIds: [],
  },
  {
    id: 'mage_to_high',
    familyId: PLAYER_CLASS_ID.MAGE,
    fromRank: CLASS_RANK_ID.MAGE_BASE,
    toRank: CLASS_RANK_ID.MAGE_ADVANCED,
    levelRequirement: 10,
    chapterRequirement: CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW,
    questRequirement: 'mage_advancement_1',
    statBonuses: { hp: 8, mp: 25, attack: 5 },
    unlockSkillIds: [],
  },
  {
    id: 'mage_to_master',
    familyId: PLAYER_CLASS_ID.MAGE,
    fromRank: CLASS_RANK_ID.MAGE_ADVANCED,
    toRank: CLASS_RANK_ID.MAGE_MASTER,
    levelRequirement: 20,
    chapterRequirement: CHAPTER_ID.CHAPTER_4_SEAL,
    questRequirement: 'mage_advancement_2',
    statBonuses: { hp: 12, mp: 35, attack: 8 },
    unlockSkillIds: [],
  },
  {
    id: 'rogue_to_shadow',
    familyId: PLAYER_CLASS_ID.ROGUE,
    fromRank: CLASS_RANK_ID.ROGUE_BASE,
    toRank: CLASS_RANK_ID.ROGUE_ADVANCED,
    levelRequirement: 10,
    chapterRequirement: CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW,
    questRequirement: 'rogue_advancement_1',
    statBonuses: { hp: 12, mp: 12, attack: 6 },
    unlockSkillIds: [],
  },
  {
    id: 'rogue_to_assassin',
    familyId: PLAYER_CLASS_ID.ROGUE,
    fromRank: CLASS_RANK_ID.ROGUE_ADVANCED,
    toRank: CLASS_RANK_ID.ROGUE_MASTER,
    levelRequirement: 20,
    chapterRequirement: CHAPTER_ID.CHAPTER_4_SEAL,
    questRequirement: 'rogue_advancement_2',
    statBonuses: { hp: 18, mp: 16, attack: 10 },
    unlockSkillIds: [],
  },
];

export function nextAdvancementFor(familyId: string, rankId: string | undefined): ClassAdvancementDefinition | null {
  return CLASS_ADVANCEMENTS.find((item) => item.familyId === familyId && item.fromRank === rankId) ?? null;
}

export function nextAdvancementsFor(familyId: string, rankId: string | undefined): ClassAdvancementDefinition[] {
  return CLASS_ADVANCEMENTS.filter((item) => item.familyId === familyId && item.fromRank === rankId);
}
