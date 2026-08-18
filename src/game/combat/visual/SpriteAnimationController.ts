import type * as Phaser from 'phaser';
import type { GameAssetDefinition, VisualAnimState } from './asset-types';
import { CombatAssetLoader } from './CombatAssetLoader';
import { animationKey, sequenceTextureKey, stateTextureKey } from './animation-keys';

export class SpriteAnimationController {
  private currentKey = '';
  private readonly onComplete: Array<() => void> = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sprite: Phaser.GameObjects.Sprite,
    private readonly kind: 'player' | 'enemy' | 'boss',
    private readonly asset: GameAssetDefinition
  ) {}

  play(state: VisualAnimState): boolean {
    CombatAssetLoader.ensureStateTexture(this.scene, this.asset, state);
    if (this.tryPlay(state)) {
      return true;
    }
    if (state === 'attack_windup' && this.tryPlay('attack')) {
      return true;
    }
    if (state === 'dash' && this.tryPlay('walk')) {
      return true;
    }
    if (state === 'charge' && (this.tryPlay('walk') || this.tryPlay('idle'))) {
      return true;
    }
    if (state === 'slam' && this.tryPlay('attack')) {
      return true;
    }
    if (state === 'walk') {
      const firstFrame = sequenceTextureKey(this.asset.textureKey, 'walk', 0);
      if (this.applyTexture(firstFrame)) {
        return true;
      }
    }

    if (state === 'idle' && this.applyTexture(this.asset.textureKey)) {
      return true;
    }

    this.currentKey = `placeholder:${state}`;
    return false;
  }

  destroy(): void {
    this.sprite.off('animationcomplete');
    this.onComplete.length = 0;
    this.currentKey = '';
  }

  private tryPlay(state: VisualAnimState): boolean {
    const animKey = animationKey(this.kind, this.asset.id, state);
    if (this.scene.anims.exists(animKey)) {
      const animation = this.scene.anims.get(animKey);
      const frameCount = animation?.frames?.length ?? 0;
      if (frameCount > 0 && this.sprite.anims) {
        if (this.currentKey === animKey) {
          return true;
        }
        try {
          this.sprite.play(animKey);
          this.currentKey = animKey;
          return true;
        } catch {
          this.currentKey = '';
        }
      }
    }

    return this.applyTexture(stateTextureKey(this.asset.textureKey, state));
  }

  private applyTexture(textureKey: string): boolean {
    if (!this.scene.textures.exists(textureKey) || textureKey === this.asset.fallbackKey) {
      return false;
    }
    if (this.currentKey === textureKey) {
      return true;
    }
    this.currentKey = textureKey;
    this.sprite.anims?.stop();
    this.sprite.setTexture(textureKey);
    return true;
  }
}
