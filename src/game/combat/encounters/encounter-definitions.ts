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
  CH1_RUINS_GATE: 'ch1_ruins_gate',
  RUINS_ARCHER_01: 'ruins_archer_01',
  RUINS_BRUTE_01: 'ruins_brute_01',
  RUINS_MIXED_01: 'ruins_mixed_01',
  RUINS_HEAVY_01: 'ruins_heavy_01',
  RUINS_BOSS_01: 'ruins_boss_01',
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
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'ambush_archer_001',
        spawnPosition: { x: 0.8, y: 0.42 },
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
        spawnPosition: { x: 0.82, y: 0.28 },
      },
    ],
    rewards: { gold: 28, items: [{ itemId: 'iron_fragment', quantity: 1 }] },
    tags: ['ch1', 'one_shot'],
  },
  [ENCOUNTER_ID.CH1_RUINS_GATE]: {
    id: ENCOUNTER_ID.CH1_RUINS_GATE,
    arenaId: ARENA_ID.RUINS_ENTRANCE,
    difficulty: 3,
    difficultyTag: 'medium_hard',
    enemies: [
      {
        enemyType: ENEMY_TYPE_ID.GOBLIN,
        instanceId: 'gate_goblin_001',
        spawnPosition: { x: 0.48, y: 0.3 },
      },
      {
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'gate_archer_001',
        spawnPosition: { x: 0.82, y: 0.36 },
      },
      {
        enemyType: ENEMY_TYPE_ID.BRUTE,
        instanceId: 'gate_brute_001',
        spawnPosition: { x: 0.62, y: 0.54 },
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
        enemyType: ENEMY_TYPE_ID.ARCHER,
        instanceId: 'archer_001',
        spawnPosition: { x: 0.78, y: 0.4 },
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
        enemyType: ENEMY_TYPE_ID.BRUTE,
        instanceId: 'brute_001',
        spawnPosition: { x: 0.7, y: 0.48 },
      },
    ],
    rewards: { gold: 30 },
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
};

const COMBAT_TO_ENCOUNTER: Record<string, EncounterIdKey> = {
  combat_goblin_ruins_01: ENCOUNTER_ID.RUINS_EASY_01,
  [ENCOUNTER_ID.RUINS_EASY_01]: ENCOUNTER_ID.RUINS_EASY_01,
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: ENCOUNTER_ID.FOREST_GOBLIN_01,
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: ENCOUNTER_ID.CH1_FOREST_SCOUTS,
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: ENCOUNTER_ID.CH1_FOREST_AMBUSH,
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: ENCOUNTER_ID.CH1_GOBLIN_CAMP,
  [ENCOUNTER_ID.CH1_RUINS_GATE]: ENCOUNTER_ID.CH1_RUINS_GATE,
  [ENCOUNTER_ID.RUINS_ARCHER_01]: ENCOUNTER_ID.RUINS_ARCHER_01,
  [ENCOUNTER_ID.RUINS_BRUTE_01]: ENCOUNTER_ID.RUINS_BRUTE_01,
  [ENCOUNTER_ID.RUINS_MIXED_01]: ENCOUNTER_ID.RUINS_MIXED_01,
  [ENCOUNTER_ID.RUINS_HEAVY_01]: ENCOUNTER_ID.RUINS_HEAVY_01,
  [ENCOUNTER_ID.RUINS_BOSS_01]: ENCOUNTER_ID.RUINS_BOSS_01,
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
