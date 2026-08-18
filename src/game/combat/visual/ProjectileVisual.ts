import type * as Phaser from 'phaser';
import type { GameAssetDefinition } from './asset-types';
import { GAME_ASSETS, getProjectileAsset } from './asset-registry';
import { CombatAssetLoader } from './CombatAssetLoader';
import { COMBAT_DEPTH } from './combat-depth';

export type ProjectileVisualKind = keyof typeof GAME_ASSETS.PROJECTILE;

export function projectileKindFromSpawn(skillId: string, owner: 'player' | 'enemy', color: number): ProjectileVisualKind {
  if (skillId === 'mage_fireball' || color === 0xff7a3d) {
    return 'FIREBALL';
  }
  if (owner === 'enemy' && (skillId === 'enemy_shot' || color === 0xffb060)) {
    return 'ENEMY_ARROW';
  }
  if (owner === 'enemy' || color === 0xb45c9a) {
    return 'BOSS_ARCANE_BOLT';
  }
  return 'MAGIC_BOLT';
}

export function createProjectileVisual(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  kind: ProjectileVisualKind
): Phaser.GameObjects.GameObject & { x: number; y: number; setPosition: (x: number, y: number) => unknown; destroy: () => void } {
  const asset: GameAssetDefinition = getProjectileAsset(kind);
  const texture = CombatAssetLoader.resolveTexture(scene, asset);
  if (scene.textures.exists(texture) && texture !== asset.fallbackKey) {
    const sprite = scene.add.sprite(x, y, texture);
    sprite.setDisplaySize(Math.max(14, radius * 2.8), Math.max(14, radius * 2.8));
    sprite.setBlendMode('ADD');
    if (kind === 'FIREBALL') {
      sprite.setTint(0xff7a3d);
    }
    sprite.setDepth(COMBAT_DEPTH.projectile);
    return sprite;
  }
  const fallback = scene.add.circle(x, y, radius, 0xd0d0d0);
  fallback.setDepth(COMBAT_DEPTH.projectile);
  return fallback;
}
