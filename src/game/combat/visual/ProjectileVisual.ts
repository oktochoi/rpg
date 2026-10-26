import type * as Phaser from 'phaser';
import type { GameAssetDefinition } from './asset-types';
import { GAME_ASSETS, getProjectileAsset } from './asset-registry';
import { CombatAssetLoader } from './CombatAssetLoader';
import { COMBAT_DEPTH } from './combat-depth';

export type ProjectileVisualKind = keyof typeof GAME_ASSETS.PROJECTILE;

export type ProjectileVisualObject = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  setPosition: (x: number, y: number) => unknown;
  destroy: () => void;
  setRotation?: (value: number) => unknown;
};

const PROJECTILE_DISPLAY: Record<ProjectileVisualKind, { width: number; height: number; additive: boolean }> = {
  // Pack frames are 256² with a thin centered glyph — size for on-screen readability.
  ENEMY_ARROW: { width: 220, height: 84, additive: false },
  MAGIC_BOLT: { width: 128, height: 128, additive: true },
  FIREBALL: { width: 136, height: 136, additive: true },
  BOSS_ARCANE_BOLT: { width: 132, height: 132, additive: true },
};

export function projectileKindFromSpawn(skillId: string, owner: 'player' | 'enemy', color: number): ProjectileVisualKind {
  if (skillId === 'mage_fireball' || color === 0xff7a3d) {
    return 'FIREBALL';
  }
  if (owner === 'enemy' && (skillId === 'enemy_mage_bolt' || color === 0x7a4ab8)) {
    return 'MAGIC_BOLT';
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
  kind: ProjectileVisualKind,
  dirX = 1,
  dirY = 0
): ProjectileVisualObject {
  const asset: GameAssetDefinition = getProjectileAsset(kind);
  const texture = CombatAssetLoader.resolveTexture(scene, asset);
  if (scene.textures.exists(texture) && texture !== asset.fallbackKey) {
    const sprite = scene.add.sprite(x, y, texture);
    const display = PROJECTILE_DISPLAY[kind];
    const width = Math.max(display.width, radius * 4);
    const height = Math.max(display.height, radius * 2.2);
    sprite.setDisplaySize(width, height);
    sprite.setBlendMode(display.additive ? 'ADD' : 'NORMAL');
    if (kind === 'FIREBALL') {
      sprite.setTint(0xff7a3d);
    }
    sprite.setRotation(Math.atan2(dirY, dirX));
    sprite.setDepth(COMBAT_DEPTH.projectile);
    return sprite;
  }
  const fallback = scene.add.circle(x, y, Math.max(radius, 8), 0xd0d0d0);
  fallback.setDepth(COMBAT_DEPTH.projectile);
  return fallback;
}
