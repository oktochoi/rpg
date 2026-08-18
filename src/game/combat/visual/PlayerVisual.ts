import type * as Phaser from 'phaser';
import { getPlayerAsset } from './asset-registry';
import { SpriteActorVisual, type ActorVisualState } from './SpriteActorVisual';

export class PlayerVisual {
  private readonly actor: SpriteActorVisual;

  constructor(scene: Phaser.Scene, classId: string, bodySize: number) {
    this.actor = new SpriteActorVisual(scene, getPlayerAsset(classId), bodySize, 'player');
  }

  update(state: ActorVisualState): void {
    this.actor.update(state);
  }

  get sprite(): Phaser.GameObjects.Sprite {
    return this.actor.sprite;
  }

  destroy(): void {
    this.actor.destroy();
  }
}
