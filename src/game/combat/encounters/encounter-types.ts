import type { EnemyTypeId } from '../enemies/enemy-types';

export interface EncounterEnemySpawn {
  enemyType: EnemyTypeId;
  instanceId?: string;
  spawnPosition: {
    x: number;
    y: number;
  };
}

export interface EncounterDefinition {
  id: string;
  arenaId: string;
  enemies: EncounterEnemySpawn[];
  bossId?: string;
  bossInstanceId?: string;
  bossSpawn?: { x: number; y: number };
  difficulty?: number;
  difficultyTag?: 'tutorial' | 'easy' | 'medium' | 'medium_hard' | 'hard';
  tags?: readonly string[];
  rewards?: {
    exp?: number;
    gold?: number;
    items?: readonly { itemId: string; quantity: number }[];
  };
}
