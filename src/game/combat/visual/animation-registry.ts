import type * as Phaser from 'phaser';
import type { GameAssetDefinition, VisualAnimState } from './asset-types';
import { ANIMATION_FRAME_RATE, animationKey, sequenceTextureKey } from './animation-keys';

export function registerSpriteAnimations(
  scene: Phaser.Scene,
  kind: 'player' | 'enemy' | 'boss',
  asset: GameAssetDefinition
): void {
  const animations = asset.animations;
  if (!animations || !asset.frameWidth || !asset.frameHeight) {
    return;
  }
  if (!scene.textures.exists(asset.textureKey)) {
    return;
  }
  const texture = scene.textures.get(asset.textureKey);
  const usableFrames = Math.max(0, texture.frameTotal - 1);

  (Object.keys(animations) as VisualAnimState[]).forEach((state) => {
    const definition = animations[state];
    if (!definition) {
      return;
    }
    const key = animationKey(kind, asset.id, state);
    if (scene.anims.exists(key)) {
      return;
    }
    if (definition.endFrame >= usableFrames) {
      return;
    }
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(asset.textureKey, {
        start: definition.startFrame,
        end: definition.endFrame,
      }),
      frameRate: definition.frameRate ?? ANIMATION_FRAME_RATE[state],
      repeat: definition.repeat,
    });
  });
}

export function registerImageSequenceAnimations(
  scene: Phaser.Scene,
  kind: 'player' | 'enemy' | 'boss',
  asset: GameAssetDefinition
): void {
  const framePaths = asset.framePaths;
  if (!framePaths) {
    return;
  }

  (Object.keys(framePaths) as VisualAnimState[]).forEach((state) => {
    const paths = framePaths[state];
    if (!paths || paths.length === 0) {
      return;
    }
    const textureKeys = paths.map((_, index) => sequenceTextureKey(asset.textureKey, state, index));
    if (textureKeys.some((key) => !scene.textures.exists(key))) {
      return;
    }
    const key = animationKey(kind, asset.id, state);
    if (scene.anims.exists(key)) {
      return;
    }
    const frames = textureKeys
      .map((textureKey) => ({ key: textureKey, frame: '__BASE' as const }))
      .filter((frame) => Boolean(scene.textures.getFrame(frame.key, frame.frame)));
    if (frames.length === 0) {
      return;
    }
    scene.anims.create({
      key,
      frames,
      frameRate: asset.sequenceFrameRate?.[state] ?? ANIMATION_FRAME_RATE[state],
      repeat: state === 'walk' || state === 'idle' ? -1 : 0,
    });
  });
}
