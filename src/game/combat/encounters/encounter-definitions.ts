import { ARENA_ID } from '../arenas/arena-types';
import { BOSS_ID, BOSS_INSTANCE_ID } from '../boss/boss-types';
import { ENEMY_TYPE_ID } from '../enemies/enemy-types';
import type { EncounterDefinition } from './encounter-types';

export const ENCOUNTER_ID = {
  RUINS_EASY_01: 'ruins_easy_01',
  FOREST_GOBLIN_01: 'forest_goblin_01',
  CH1_FOREST_SCOUTS: 'ch1_forest_scouts',
  CH1_FOREST_AMBUSH: 'ch1_forest_ambush',
  CH1_GOBLIN_CAMP: 'ch1_goblin_camp',
  CH1_FOREST_DEEP: 'ch1_forest_deep',
  CH1_FOREST_KEY_HOLDER: 'ch1_forest_key_holder',
  CH1_RUINS_GATE: 'ch1_ruins_gate',
  RUINS_ARCHER_01: 'ruins_archer_01',
  RUINS_BRUTE_01: 'ruins_brute_01',
  RUINS_MAGE_01: 'ruins_mage_01',
  FOREST_WOLF_01: 'forest_wolf_01',
  RUINS_MIXED_01: 'ruins_mixed_01',
  RUINS_HEAVY_01: 'ruins_heavy_01',
  RUINS_BOSS_01: 'ruins_boss_01',
  TRAINING_GROUNDS: 'training_grounds',
} as const;

export type EncounterIdKey = (typeof ENCOUNTER_ID)[keyof typeof ENCOUNTER_ID];

export const ENCOUNTERS: Record<EncounterIdKey, EncounterDefinition> = {
  [ENCOUNTER_ID.RUINS_EASY_01]: {
    id: ENCOUNTER_ID.RUINS_EASY_01,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 1,
    difficultyTag: 'tutorial',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'goblin_01',
        spawnPosition: { x: 0.72, y: 0.45 },
      },
    ],
    rewards: { gold: 12, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
  },
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: {
    id: ENCOUNTER_ID.FOREST_GOBLIN_01,
    arenaId: ARENA_ID.FOREST_SCOUTS,
    difficulty: 1,
    difficultyTag: 'tutorial',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'forest_goblin_001',
        spawnPosition: { x: 0.64, y: 0.36 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'forest_goblin_002',
        spawnPosition: { x: 0.7, y: 0.58 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'forest_goblin_003',
        spawnPosition: { x: 0.84, y: 0.42 },
      },
    ],
    rewards: { gold: 18, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
    tags: ['ch1', 'one_shot'],
  },
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: {
    id: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
    arenaId: ARENA_ID.FOREST_SCOUTS,
    difficulty: 1,
    difficultyTag: 'tutorial',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'scout_goblin_001',
        spawnPosition: { x: 0.62, y: 0.34 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'scout_goblin_002',
        spawnPosition: { x: 0.7, y: 0.58 },
      },
      {
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'scout_archer_001',
        spawnPosition: { x: 0.86, y: 0.4 },
      },
    ],
    rewards: { gold: 18, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
    tags: ['ch1', 'one_shot'],
  },
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: {
    id: ENCOUNTER_ID.CH1_FOREST_AMBUSH,
    arenaId: ARENA_ID.FOREST_AMBUSH,
    difficulty: 2,
    difficultyTag: 'easy',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'ambush_goblin_001',
        spawnPosition: { x: 0.38, y: 0.32 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'ambush_goblin_002',
        spawnPosition: { x: 0.3, y: 0.74 },
      },
      {
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'ambush_archer_001',
        spawnPosition: { x: 0.82, y: 0.46 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'ambush_goblin_003',
        spawnPosition: { x: 0.6, y: 0.22 },
      },
    ],
    rewards: { gold: 22, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
    tags: ['ch1', 'one_shot', 'optional'],
  },
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: {
    id: ENCOUNTER_ID.CH1_GOBLIN_CAMP,
    arenaId: ARENA_ID.GOBLIN_CAMP,
    difficulty: 2,
    difficultyTag: 'medium',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'camp_goblin_001',
        spawnPosition: { x: 0.4, y: 0.3 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'camp_goblin_002',
        spawnPosition: { x: 0.42, y: 0.64 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'camp_goblin_003',
        spawnPosition: { x: 0.52, y: 0.48 },
      },
      {
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'camp_archer_001',
        spawnPosition: { x: 0.84, y: 0.26 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'camp_goblin_004',
        spawnPosition: { x: 0.86, y: 0.62 },
      },
    ],
    rewards: { gold: 28, items: [{ itemId: 'iron_fragment', quantity: 1 }] },
    tags: ['ch1', 'one_shot'],
  },
  [ENCOUNTER_ID.CH1_FOREST_DEEP]: {
    id: ENCOUNTER_ID.CH1_FOREST_DEEP,
    arenaId: ARENA_ID.FOREST_AMBUSH,
    difficulty: 3,
    difficultyTag: 'medium',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'deep_goblin_001',
        spawnPosition: { x: 0.36, y: 0.28 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'deep_goblin_002',
        spawnPosition: { x: 0.32, y: 0.7 },
      },
      {
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'deep_archer_001',
        spawnPosition: { x: 0.84, y: 0.34 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'deep_goblin_003',
        spawnPosition: { x: 0.58, y: 0.46 },
      },
    ],
    rewards: { gold: 32, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
    tags: ['ch1'],
  },
  [ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER]: {
    id: ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER,
    arenaId: ARENA_ID.GOBLIN_CAMP,
    difficulty: 3,
    difficultyTag: 'medium_hard',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'key_holder_goblin_001',
        spawnPosition: { x: 0.52, y: 0.4 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'key_holder_goblin_002',
        spawnPosition: { x: 0.68, y: 0.56 },
      },
      {
        enemyType: ENEMY_TYPE_ID.DIRE_WOLF,
        instanceId: 'key_holder_wolf_001',
        spawnPosition: { x: 0.84, y: 0.4 },
      },
      {
        enemyType: ENEMY_TYPE_ID.DIRE_WOLF,
        instanceId: 'key_holder_wolf_002',
        spawnPosition: { x: 0.46, y: 0.7 },
      },
    ],
    rewards: { gold: 34, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
    tags: ['ch1', 'key_holder'],
  },
  [ENCOUNTER_ID.CH1_RUINS_GATE]: {
    id: ENCOUNTER_ID.CH1_RUINS_GATE,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 3,
    difficultyTag: 'medium_hard',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.BRUTE,
        instanceId: 'gate_brute_001',
        spawnPosition: { x: 0.56, y: 0.34 },
      },
      {
        enemyType: ENEMY_TYPE_ID.BRUTE,
        instanceId: 'gate_brute_002',
        spawnPosition: { x: 0.52, y: 0.64 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN_MAGE,
        instanceId: 'gate_mage_001',
        spawnPosition: { x: 0.84, y: 0.46 },
      },
    ],
    rewards: { gold: 36, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
    tags: ['ch1', 'one_shot'],
  },
  [ENCOUNTER_ID.RUINS_ARCHER_01]: {
    id: ENCOUNTER_ID.RUINS_ARCHER_01,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 1,
    difficultyTag: 'tutorial',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'archer_screen_001',
        spawnPosition: { x: 0.56, y: 0.52 },
      },
      {
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'archer_001',
        spawnPosition: { x: 0.82, y: 0.36 },
      },
    ],
    rewards: { gold: 18 },
  },
  [ENCOUNTER_ID.RUINS_BRUTE_01]: {
    id: ENCOUNTER_ID.RUINS_BRUTE_01,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 2,
    difficultyTag: 'medium',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'brute_escort_001',
        spawnPosition: { x: 0.52, y: 0.32 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'brute_escort_002',
        spawnPosition: { x: 0.54, y: 0.66 },
      },
      {
        enemyType: ENEMY_TYPE_ID.BRUTE,
        instanceId: 'brute_001',
        spawnPosition: { x: 0.72, y: 0.48 },
      },
    ],
    rewards: { gold: 30 },
  },
  [ENCOUNTER_ID.RUINS_MAGE_01]: {
    id: ENCOUNTER_ID.RUINS_MAGE_01,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 2,
    difficultyTag: 'easy',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'mage_escort_001',
        spawnPosition: { x: 0.54, y: 0.32 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'mage_escort_002',
        spawnPosition: { x: 0.56, y: 0.64 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN_MAGE,
        instanceId: 'mage_001',
        spawnPosition: { x: 0.82, y: 0.44 },
      },
    ],
    rewards: { gold: 22 },
  },
  [ENCOUNTER_ID.FOREST_WOLF_01]: {
    id: ENCOUNTER_ID.FOREST_WOLF_01,
    arenaId: ARENA_ID.FOREST_SCOUTS,
    difficulty: 2,
    difficultyTag: 'easy',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.DIRE_WOLF,
        instanceId: 'wolf_001',
        spawnPosition: { x: 0.68, y: 0.4 },
      },
      {
        enemyType: ENEMY_TYPE_ID.DIRE_WOLF,
        instanceId: 'wolf_002',
        spawnPosition: { x: 0.8, y: 0.58 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'wolf_handler_001',
        spawnPosition: { x: 0.58, y: 0.46 },
      },
    ],
    rewards: { gold: 24 },
  },
  [ENCOUNTER_ID.RUINS_MIXED_01]: {
    id: ENCOUNTER_ID.RUINS_MIXED_01,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 2,
    difficultyTag: 'medium',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'goblin_001',
        spawnPosition: { x: 0.66, y: 0.34 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'goblin_002',
        spawnPosition: { x: 0.74, y: 0.58 },
      },
      {
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'archer_001',
        spawnPosition: { x: 0.84, y: 0.42 },
      },
    ],
    rewards: { gold: 32, items: [{ itemId: 'goblin_ear', quantity: 1 }] },
  },
  [ENCOUNTER_ID.RUINS_HEAVY_01]: {
    id: ENCOUNTER_ID.RUINS_HEAVY_01,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 3,
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.BRUTE,
        instanceId: 'brute_001',
        spawnPosition: { x: 0.7, y: 0.46 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'goblin_001',
        spawnPosition: { x: 0.58, y: 0.3 },
      },
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'goblin_002',
        spawnPosition: { x: 0.78, y: 0.62 },
      },
    ],
    rewards: { gold: 40 },
  },
  [ENCOUNTER_ID.RUINS_BOSS_01]: {
    id: ENCOUNTER_ID.RUINS_BOSS_01,
    arenaId: ARENA_ID.RUINS_GUARDIAN,
    difficulty: 4,
    difficultyTag: 'hard',
    bossId: BOSS_ID.RUINS_GUARDIAN,
    bossInstanceId: BOSS_INSTANCE_ID.RUINS_GUARDIAN,
    bossSpawn: { x: 0.72, y: 0.46 },
    enemies: [],
    tags: ['boss', 'ruins', 'guardian'],
    rewards: { gold: 120 },
  },
  [ENCOUNTER_ID.TRAINING_GROUNDS]: {
    id: ENCOUNTER_ID.TRAINING_GROUNDS,
    arenaId: ARENA_ID.TRAINING_YARD,
    difficulty: 0,
    difficultyTag: 'tutorial',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.TRAINING_DUMMY,
        instanceId: 'training_dummy_001',
        spawnPosition: { x: 0.55, y: 0.35 },
      },
      {
        enemyType: ENEMY_TYPE_ID.TRAINING_DUMMY,
        instanceId: 'training_dummy_002',
        spawnPosition: { x: 0.72, y: 0.5 },
      },
      {
        enemyType: ENEMY_TYPE_ID.TRAINING_DUMMY,
        instanceId: 'training_dummy_003',
        spawnPosition: { x: 0.58, y: 0.68 },
      },
    ],
    tags: ['training', 'village'],
    rewards: { gold: 0 },
  },
};

const COMBAT_TO_ENCOUNTER: Record<string, EncounterIdKey> = {
  combat_goblin_ruins_01: ENCOUNTER_ID.RUINS_EASY_01,
  [ENCOUNTER_ID.RUINS_EASY_01]: ENCOUNTER_ID.RUINS_EASY_01,
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: ENCOUNTER_ID.FOREST_GOBLIN_01,
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: ENCOUNTER_ID.CH1_FOREST_AMBUSH,
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: ENCOUNTER_ID.CH1_GOBLIN_CAMP,
  [ENCOUNTER_ID.CH1_FOREST_DEEP]: ENCOUNTER_ID.CH1_FOREST_DEEP,
  [ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER]: ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER,
  [ENCOUNTER_ID.CH1_RUINS_GATE]: ENCOUNTER_ID.CH1_RUINS_GATE,
  [ENCOUNTER_ID.RUINS_ARCHER_01]: ENCOUNTER_ID.RUINS_ARCHER_01,
  [ENCOUNTER_ID.RUINS_BRUTE_01]: ENCOUNTER_ID.RUINS_BRUTE_01,
  [ENCOUNTER_ID.RUINS_MAGE_01]: ENCOUNTER_ID.RUINS_MAGE_01,
  [ENCOUNTER_ID.FOREST_WOLF_01]: ENCOUNTER_ID.FOREST_WOLF_01,
  [ENCOUNTER_ID.RUINS_MIXED_01]: ENCOUNTER_ID.RUINS_MIXED_01,
  [ENCOUNTER_ID.RUINS_HEAVY_01]: ENCOUNTER_ID.RUINS_HEAVY_01,
  [ENCOUNTER_ID.RUINS_BOSS_01]: ENCOUNTER_ID.RUINS_BOSS_01,
  [ENCOUNTER_ID.TRAINING_GROUNDS]: ENCOUNTER_ID.TRAINING_GROUNDS,
};

export function getEncounter(encounterId: string): EncounterDefinition | null {
  const source = ENCOUNTERS[encounterId as EncounterIdKey];
  return source ? cloneEncounter(source) : null;
}

export function resolveEncounterId(combatId: string): EncounterIdKey | null {
  return COMBAT_TO_ENCOUNTER[combatId] ?? null;
}

export function isStartableCombatId(combatId: string): boolean {
  return resolveEncounterId(combatId) !== null;
}

export function cloneEncounter(definition: EncounterDefinition): EncounterDefinition {
  return {
    id: definition.id,
    arenaId: definition.arenaId,
    difficulty: definition.difficulty,
    difficultyTag: definition.difficultyTag,
    bossId: definition.bossId,
    bossInstanceId: definition.bossInstanceId,
    bossSpawn: definition.bossSpawn ? { x: definition.bossSpawn.x, y: definition.bossSpawn.y } : undefined,
    tags: definition.tags,
    rewards: definition.rewards
      ? {
          exp: definition.rewards.exp,
          gold: definition.rewards.gold,
          items: definition.rewards.items?.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
        }
      : undefined,
    enemies: definition.enemies.map((spawn) => ({
      enemyType: spawn.enemyType,
      instanceId: spawn.instanceId,
      spawnPosition: { x: spawn.spawnPosition.x, y: spawn.spawnPosition.y },
    })),
  };
}

export function isBossEncounter(encounterId: string): boolean {
  return encounterId === ENCOUNTER_ID.RUINS_BOSS_01;
}

export function resolveSpawnPoint(
  position: { x: number; y: number },
  width: number,
  height: number,
  origin: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  if (position.x >= 0 && position.x <= 1 && position.y >= 0 && position.y <= 1) {
    return { x: origin.x + position.x * width, y: origin.y + position.y * height };
  }
  return { x: position.x, y: position.y };
}

export function allocateInstanceId(enemyType: string, used: ReadonlySet<string>, preferred?: string): string {
  if (preferred && !used.has(preferred)) {
    return preferred;
  }
  let index = 1;
  let candidate = `${enemyType}_${String(index).padStart(3, '0')}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${enemyType}_${String(index).padStart(3, '0')}`;
  }
  return candidate;
}

export function isVictoryByAliveCount(aliveCount: number, spawnedCount: number): boolean {
  return spawnedCount > 0 && aliveCount === 0;
}
