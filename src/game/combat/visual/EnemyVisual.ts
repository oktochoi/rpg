import type * as Phaser from 'phaser';
import { getEnemyAsset } from './asset-registry';
import { SpriteActorVisual, type ActorVisualState } from './SpriteActorVisual';

export class EnemyVisual {
  private readonly actor: SpriteActorVisual;

  constructor(scene: Phaser.Scene, typeId: string, bodySize: number) {
    this.actor = new SpriteActorVisual(scene, getEnemyAsset(typeId), bodySize, 'enemy');
  }

  update(state: ActorVisualState): void {
    this.actor.update(state);
  }

  destroy(): void {
    this.actor.destroy();
  }
}
