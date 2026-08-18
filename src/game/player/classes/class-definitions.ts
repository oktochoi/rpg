import type { PlayerSkill, PlayerState } from '../player-state';
import { LEVEL_GROWTH } from '../progression/level-config';
import { baseRankIdForClass } from './class-ranks';
import {
  PLAYER_CLASS_ID,
  type DashProfile,
  type PlayerClassDefinition,
  type PlayerClassId,
} from './class-types';

export const WANDERER_BASE_STATS = {
  maxHp: 100,
  maxMp: 60,
  moveSpeed: 220,
} as const;

export const DASH_PROFILES: Readonly<Record<string, DashProfile>> = {
  adventurer_dash: {
    id: 'adventurer_dash',
    speed: 460,
    durationMs: 120,
    cooldownMs: 850,
    invincibleMs: 110,
    style: 'dash',
  },
  warrior_dash: {
    id: 'warrior_dash',
    speed: 500,
    durationMs: 130,
    cooldownMs: 780,
    invincibleMs: 140,
    style: 'dash',
  },
  mage_dash: {
    id: 'mage_dash',
    speed: 2000,
    durationMs: 48,
    cooldownMs: 880,
    invincibleMs: 90,
    style: 'blink',
  },
  rogue_dash: {
    id: 'rogue_dash',
    speed: 880,
    durationMs: 155,
    cooldownMs: 520,
    invincibleMs: 70,
    style: 'dash',
  },
};

export const PLAYER_CLASSES: Readonly<Record<PlayerClassId, PlayerClassDefinition>> = {
  adventurer: {
    id: PLAYER_CLASS_ID.ADVENTURER,
    name: '모험가',
    description: '아직 길을 정하지 않은 신입. 기본 근접과 회피로 버틴다.',
    playStyle: '기본 근접 / 회피',
    baseStats: {
      maxHp: 100,
      maxMp: 70,
      moveSpeed: 220,
      attackPower: 16,
    },
    combat: {
      basicAttackId: 'warrior_slash',
      dashProfileId: 'adventurer_dash',
      skillIds: ['adventurer_quick_strike'],
    },
  },
  warrior: {
    id: PLAYER_CLASS_ID.WARRIOR,
    name: '검사',
    description: '높은 체력과 강한 근접 공격. 방어와 정면 전투에 강함.',
    playStyle: '정면 근접 / 방어',
    baseStats: {
      maxHp: 130,
      maxMp: 60,
      moveSpeed: 220,
      attackPower: 28,
    },
    combat: {
      basicAttackId: 'warrior_slash',
      dashProfileId: 'warrior_dash',
      skillIds: ['warrior_charge_slash', 'warrior_guard'],
    },
  },
  mage: {
    id: PLAYER_CLASS_ID.MAGE,
    name: '마법사',
    description: '원거리 마법과 강한 범위 공격. 낮은 체력 대신 높은 MP.',
    playStyle: '원거리 마법 / 범위',
    baseStats: {
      maxHp: 85,
      maxMp: 150,
      moveSpeed: 205,
      attackPower: 18,
    },
    combat: {
      basicAttackId: 'mage_bolt',
      dashProfileId: 'mage_dash',
      skillIds: ['mage_fireball', 'mage_frost_nova'],
    },
  },
  rogue: {
    id: PLAYER_CLASS_ID.ROGUE,
    name: '도적',
    description: '빠른 이동과 기습. 위치 선정과 빠른 연속 공격.',
    playStyle: '기동 / 기습',
    baseStats: {
      maxHp: 100,
      maxMp: 90,
      moveSpeed: 250,
      attackPower: 22,
    },
    combat: {
      basicAttackId: 'rogue_stab',
      dashProfileId: 'rogue_dash',
      skillIds: ['rogue_shadow_dash', 'rogue_backstab'],
    },
  },
};

export function isPlayerClassId(classId: string): classId is PlayerClassId {
  return (
    classId === PLAYER_CLASS_ID.ADVENTURER ||
    classId === PLAYER_CLASS_ID.WARRIOR ||
    classId === PLAYER_CLASS_ID.MAGE ||
    classId === PLAYER_CLASS_ID.ROGUE
  );
}

export function isSpecializedClassId(classId: string): boolean {
  return classId === PLAYER_CLASS_ID.WARRIOR || classId === PLAYER_CLASS_ID.MAGE || classId === PLAYER_CLASS_ID.ROGUE;
}

export function combatFamilyFor(classId: string): PlayerClassId {
  return isPlayerClassId(classId) ? classId : PLAYER_CLASS_ID.ADVENTURER;
}

export function resolvePlayerClassId(classId: string): PlayerClassId {
  if (classId === 'wanderer') {
    return PLAYER_CLASS_ID.ADVENTURER;
  }
  return isPlayerClassId(classId) ? classId : PLAYER_CLASS_ID.ADVENTURER;
}

export function getStoredPlayerClassId(player: Pick<PlayerState, 'classId'>): string {
  return player.classId;
}

export function getPlayerClass(classId: string): PlayerClassDefinition {
  return PLAYER_CLASSES[resolvePlayerClassId(classId)];
}

export function getDashProfile(classId: string): DashProfile {
  const definition = getPlayerClass(classId);
  return DASH_PROFILES[definition.combat.dashProfileId] ?? DASH_PROFILES.warrior_dash;
}

export function startingCombatSkills(classId: string): PlayerSkill[] {
  return getPlayerClass(classId).combat.skillIds.map((id) => ({ id, usableIn: 'COMBAT' as const }));
}

export function applyPlayerClass(player: PlayerState, classId: string): PlayerState {
  if (!isPlayerClassId(classId) || classId === PLAYER_CLASS_ID.ADVENTURER) {
    const definition = PLAYER_CLASSES[PLAYER_CLASS_ID.ADVENTURER];
    return {
      ...player,
      classId: PLAYER_CLASS_ID.ADVENTURER,
      classRankId: baseRankIdForClass(PLAYER_CLASS_ID.ADVENTURER) ?? undefined,
      level: player.level ?? 1,
      exp: player.exp ?? 0,
      attackPower: definition.baseStats.attackPower,
      maxHp: definition.baseStats.maxHp,
      currentHp: definition.baseStats.maxHp,
      maxMp: definition.baseStats.maxMp,
      currentMp: definition.baseStats.maxMp,
      skills: startingCombatSkills(PLAYER_CLASS_ID.ADVENTURER),
    };
  }

  const definition = PLAYER_CLASSES[classId];
  const level = Math.max(1, player.level ?? 1);
  const steps = Math.max(0, level - 1);
  const growth = LEVEL_GROWTH[classId];
  const maxHp = definition.baseStats.maxHp + growth.hp * steps;
  const maxMp = definition.baseStats.maxMp + growth.mp * steps;
  const attackPower = definition.baseStats.attackPower + growth.attack * steps;
  return {
    ...player,
    classId,
    classRankId: baseRankIdForClass(classId) ?? player.classRankId,
    level,
    exp: player.exp ?? 0,
    attackPower,
    maxHp,
    currentHp: maxHp,
    maxMp,
    currentMp: maxMp,
    skills: startingCombatSkills(classId),
  };
}
