import type * as Phaser from 'phaser';
import { BossVisual } from './BossVisual';
import { EnemyVisual } from './EnemyVisual';
import { PlayerVisual } from './PlayerVisual';

export function createPlayerVisual(scene: Phaser.Scene, classId: string, bodySize: number): PlayerVisual {
  return new PlayerVisual(scene, classId, bodySize);
}

export function createEnemyVisual(scene: Phaser.Scene, enemyType: string, bodySize: number): EnemyVisual {
  return new EnemyVisual(scene, enemyType, bodySize);
}

export function createBossVisual(scene: Phaser.Scene, bossId: string, bodySize: number): BossVisual {
  return new BossVisual(scene, bossId, bodySize);
}
