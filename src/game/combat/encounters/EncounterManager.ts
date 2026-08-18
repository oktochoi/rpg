import { createEnemyBehavior } from '../enemies/behaviors/create-enemy-behavior';
import { getEnemyDefinition } from '../enemies/enemy-definitions';
import type { EnemyManager } from '../enemies/EnemyManager';
import {
  allocateInstanceId,
  cloneEncounter,
  getEncounter,
  isVictoryByAliveCount,
  resolveSpawnPoint,
} from './encounter-definitions';
import type { EncounterDefinition, EncounterEnemySpawn } from './encounter-types';

export interface EncounterStartOptions {
  width: number;
  height: number;
  originX?: number;
  originY?: number;
  instanceIds?: readonly string[];
}

export class EncounterManager {
  private definition: EncounterDefinition | null = null;
  private spawnedCount = 0;

  constructor(private readonly enemies: EnemyManager) {}

  load(encounterId: string): EncounterDefinition | null {
    const source = getEncounter(encounterId);
    this.definition = source ? cloneEncounter(source) : null;
    return this.definition;
  }

  start(encounterId: string, options: EncounterStartOptions): EncounterDefinition | null {
    this.enemies.destroyAll();
    this.spawnedCount = 0;
    const definition = this.load(encounterId);
    if (!definition) {
      return null;
    }

    const used = new Set<string>();
    definition.enemies.forEach((spawn, index) => {
      const overrideId = options.instanceIds?.[index];
      const instanceId = allocateInstanceId(spawn.enemyType, used, overrideId ?? spawn.instanceId);
      used.add(instanceId);
      const point = resolveSpawnPoint(spawn.spawnPosition, options.width, options.height, {
        x: options.originX ?? 0,
        y: options.originY ?? 0,
      });
      const definitionForType = getEnemyDefinition(spawn.enemyType);
      this.enemies.spawnEnemy({
        instanceId,
        typeId: spawn.enemyType,
        definition: definitionForType,
        behavior: createEnemyBehavior(definitionForType.behaviorType),
        x: point.x,
        y: point.y,
      });
      this.spawnedCount += 1;
    });

    return definition;
  }

  getDefinition(): EncounterDefinition | null {
    return this.definition;
  }

  getAliveCount(): number {
    return this.enemies.getAliveCount();
  }

  isVictory(): boolean {
    return isVictoryByAliveCount(this.enemies.getAliveCount(), this.spawnedCount);
  }

  haltAll(): void {
    this.enemies.haltAll();
  }

  update(delta: number, bounds: { width: number; height: number }): void {
    this.enemies.update(delta, bounds);
  }

  destroy(): void {
    this.enemies.destroyAll();
    this.definition = null;
    this.spawnedCount = 0;
  }
}

export function snapshotSpawns(definition: EncounterDefinition, instanceIds?: readonly string[]): EncounterEnemySpawn[] {
  const used = new Set<string>();
  return definition.enemies.map((spawn, index) => {
    const instanceId = allocateInstanceId(spawn.enemyType, used, instanceIds?.[index] ?? spawn.instanceId);
    used.add(instanceId);
    return {
      enemyType: spawn.enemyType,
      instanceId,
      spawnPosition: { ...spawn.spawnPosition },
    };
  });
}
