import type * as Phaser from 'phaser';
import type { EffectAssetDefinition, GameAssetDefinition, VisualAnimState } from './asset-types';
import { warnMissingAsset } from './asset-missing';
import { registerImageSequenceAnimations, registerSpriteAnimations } from './animation-registry';
import { sequenceTextureKey, stateTextureKey } from './animation-keys';
import { listCombatSpriteAssets, listEffectAssets } from './asset-registry';
import { ensurePlaceholderTextures } from './placeholder-textures';

const skippedPaths = new Set<string>();

export class CombatAssetLoader {
  static preload(_scene: Phaser.Scene): void {
    // Files are hydrated in create() so a missing PNG cannot fail Phaser preload.
  }

  static create(scene: Phaser.Scene): void {
    ensurePlaceholderTextures(scene);
    hydrateSpriteAssets(scene);
    hydrateEffectAssets(scene);
  }

  static resolveTexture(scene: Phaser.Scene, asset: GameAssetDefinition): string {
    if (scene.textures.exists(asset.textureKey) && asset.textureKey !== asset.fallbackKey) {
      return asset.textureKey;
    }
    if (!scene.textures.exists(asset.textureKey)) {
      warnMissingAsset(asset.id);
    }
    if (!scene.textures.exists(asset.fallbackKey)) {
      ensurePlaceholderTextures(scene);
    }
    return asset.fallbackKey;
  }

  static ensureStateTexture(scene: Phaser.Scene, asset: GameAssetDefinition, state: VisualAnimState): void {
    const path = asset.stateTextures?.[state];
    if (path) {
      loadImage(scene, path, stateTextureKey(asset.textureKey, state), asset, 'state');
    }
    const frames = asset.framePaths?.[state];
    if (!frames) {
      return;
    }
    frames.forEach((framePath, index) => {
      loadImage(scene, framePath, sequenceTextureKey(asset.textureKey, state, index), asset, 'state');
    });
  }
}

function hydrateSpriteAssets(scene: Phaser.Scene): void {
  if (typeof Image === 'undefined') {
    return;
  }
  for (const asset of listCombatSpriteAssets()) {
    loadImage(scene, asset.path, asset.textureKey, asset, 'sheet-or-idle');
    for (const [state, path] of Object.entries(asset.stateTextures ?? {})) {
      loadImage(scene, path, stateTextureKey(asset.textureKey, state as VisualAnimState), asset, 'state');
    }
    for (const [state, paths] of Object.entries(asset.framePaths ?? {})) {
      paths.forEach((framePath, index) => {
        loadImage(scene, framePath, sequenceTextureKey(asset.textureKey, state as VisualAnimState, index), asset, 'state');
      });
    }
    registerImageSequenceAnimations(scene, assetKind(asset), asset);
  }
}

function hydrateEffectAssets(scene: Phaser.Scene): void {
  if (typeof Image === 'undefined') {
    return;
  }
  for (const effect of listEffectAssets()) {
    loadEffectImage(scene, effect);
  }
}

function loadEffectImage(scene: Phaser.Scene, effect: EffectAssetDefinition): void {
  if (skippedPaths.has(effect.path) || scene.textures.exists(effect.textureKey)) {
    return;
  }
  const image = new Image();
  image.onload = () => {
    if (!scene.sys?.isActive() || scene.textures.exists(effect.textureKey)) {
      return;
    }
    scene.textures.addImage(effect.textureKey, image);
  };
  image.onerror = () => {
    skippedPaths.add(effect.path);
    warnMissingAsset(`${effect.id}:${effect.path}`);
  };
  image.src = effect.path;
}

function loadImage(
  scene: Phaser.Scene,
  path: string,
  textureKey: string,
  asset: GameAssetDefinition,
  mode: 'sheet-or-idle' | 'state'
): void {
  if (skippedPaths.has(path)) {
    return;
  }
  if (scene.textures.exists(textureKey)) {
    registerImageSequenceAnimations(scene, assetKind(asset), asset);
    return;
  }
  const image = new Image();
  image.onload = () => {
    if (!scene.sys?.isActive() || scene.textures.exists(textureKey)) {
      return;
    }
    if (mode === 'sheet-or-idle' && asset.frameWidth && asset.frameHeight) {
      scene.textures.addSpriteSheet(textureKey, image, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
      registerSpriteAnimations(scene, assetKind(asset), asset);
      return;
    }
    scene.textures.addImage(textureKey, image);
    registerImageSequenceAnimations(scene, assetKind(asset), asset);
  };
  image.onerror = () => {
    skippedPaths.add(path);
    warnMissingAsset(`${asset.id}:${path}`);
  };
  image.src = path;
}

function assetKind(asset: GameAssetDefinition): 'player' | 'enemy' | 'boss' {
  if (asset.type === 'enemy') {
    return 'enemy';
  }
  if (asset.type === 'boss') {
    return 'boss';
  }
  return 'player';
}
