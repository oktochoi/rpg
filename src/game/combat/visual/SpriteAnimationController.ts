import type * as Phaser from 'phaser';
import type { GameAssetDefinition, VisualAnimState } from './asset-types';
import { CombatAssetLoader } from './CombatAssetLoader';
import { ANIMATION_FRAME_RATE, animationKey, sequenceTextureKey, stateTextureKey } from './animation-keys';

export class SpriteAnimationController {
  private currentKey = '';
  private swingIndex = 0;
  private swingScale = 1;
  private travelScale = 1;
  private readonly onComplete: Array<() => void> = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sprite: Phaser.GameObjects.Sprite,
    private readonly kind: 'player' | 'enemy' | 'boss',
    private readonly asset: GameAssetDefinition
  ) {}

  play(state: VisualAnimState, speedPx = 0): boolean {
    if (state === 'idle' && this.kind === 'player') {
      return this.holdFirstFrame(state);
    }
    if (this.sprite.anims) {
      const attack = state === 'attack' || state === 'attack_windup';
      const animKey = animationKey(this.kind, this.asset.id, state);
      if (attack && this.currentKey !== animKey) {
        const rates = [0.86, 1.08, 0.94, 1.16];
        this.swingScale = rates[this.swingIndex % rates.length] ?? 1;
        this.swingIndex += 1;
      }
      this.travelScale = this.timeScaleFor(state, speedPx);
      this.sprite.anims.timeScale = this.travelScale;
    }
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

  /**
   * One walk cycle should cover about one body length on the ground.
   * A fixed slow fps made the feet slide behind the actual travel.
   */
  private timeScaleFor(state: VisualAnimState, speedPx: number): number {
    if (state === 'attack' || state === 'attack_windup') {
      return this.swingScale;
    }
    if (state !== 'walk' && state !== 'dash') {
      return 1;
    }
    if (speedPx < 30) {
      return 1;
    }
    const definition = this.asset.animations?.[state] ?? (state === 'dash' ? this.asset.animations?.walk : undefined);
    const baseFps =
      definition?.frameRate ?? this.asset.sequenceFrameRate?.[state] ?? ANIMATION_FRAME_RATE[state];
    const frameCount = definition
      ? Math.max(1, definition.endFrame - definition.startFrame + 1)
      : Math.max(1, this.asset.framePaths?.[state]?.length ?? 8);
    const stride = Math.max(56, this.asset.visualSize * (state === 'dash' ? 1.35 : 0.9));
    const fps = (frameCount * speedPx) / stride;
    const scale = fps / Math.max(1, baseFps);
    return Math.min(state === 'dash' ? 1.8 : 2.15, Math.max(0.85, scale));
  }

  /** Standing still uses one frame. Walk plays only while moving. */
  private holdFirstFrame(state: VisualAnimState): boolean {
    const stillKey = `still:${animationKey(this.kind, this.asset.id, state)}`;
    if (this.currentKey === stillKey) {
      return true;
    }
    const animKey = animationKey(this.kind, this.asset.id, state);
    if (this.scene.anims.exists(animKey)) {
      const frame = this.scene.anims.get(animKey)?.frames?.[0];
      if (frame) {
        this.sprite.anims?.stop();
        this.sprite.setTexture(frame.textureKey, frame.textureFrame);
        this.currentKey = stillKey;
        return true;
      }
    }
    const sequence = sequenceTextureKey(this.asset.textureKey, state, 0);
    if (this.scene.textures.exists(sequence) && sequence !== this.asset.fallbackKey) {
      this.sprite.anims?.stop();
      this.sprite.setTexture(sequence);
      this.currentKey = stillKey;
      return true;
    }
    const idle = this.asset.animations?.idle;
    if (idle && this.scene.textures.exists(this.asset.textureKey)) {
      this.sprite.anims?.stop();
      this.sprite.setTexture(this.asset.textureKey, idle.startFrame);
      this.currentKey = stillKey;
      return true;
    }
    return false;
  }

  private tryPlay(state: VisualAnimState): boolean {
    const animKey = animationKey(this.kind, this.asset.id, state);
    if (this.scene.anims.exists(animKey)) {
      const animation = this.scene.anims.get(animKey);
      const frameCount = animation?.frames?.length ?? 0;
      if (frameCount > 0 && this.sprite.anims) {
        if (this.currentKey === animKey) {
          this.sprite.anims.timeScale = this.travelScale;
          return true;
        }
        try {
          this.sprite.play(animKey);
          this.sprite.anims.timeScale = this.travelScale;
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
