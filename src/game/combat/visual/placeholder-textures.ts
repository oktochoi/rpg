import type * as Phaser from 'phaser';
import type { PlaceholderStyle } from './asset-types';
import { PLACEHOLDER_STYLES } from './asset-registry';

export function ensurePlaceholderTextures(scene: Phaser.Scene): void {
  for (const style of PLACEHOLDER_STYLES) {
    if (scene.textures.exists(style.key)) {
      continue;
    }
    drawPlaceholder(scene, style);
  }
}

function drawPlaceholder(scene: Phaser.Scene, style: PlaceholderStyle): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  const size = style.size;
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, size, size);

  if (style.kind === 'adventurer') {
    g.fillStyle(style.fill, 1);
    g.fillRoundedRect(12, 16, 40, 40, 4);
    g.fillStyle(style.accent, 1);
    g.fillRect(20, 12, 24, 8);
    g.fillRect(28, 30, 8, 20);
  } else if (style.kind === 'warrior') {
    g.fillStyle(style.fill, 1);
    g.fillRoundedRect(10, 14, 44, 42, 4);
    g.fillStyle(style.accent, 1);
    g.fillRect(18, 8, 28, 12);
    g.fillRect(28, 28, 8, 22);
  } else if (style.kind === 'mage') {
    g.fillStyle(style.fill, 1);
    g.fillCircle(32, 38, 18);
    g.fillTriangle(16, 28, 32, 4, 48, 28);
    g.fillStyle(style.accent, 1);
    g.fillCircle(32, 36, 6);
  } else if (style.kind === 'rogue') {
    g.fillStyle(style.fill, 1);
    g.fillTriangle(32, 8, 50, 56, 14, 56);
    g.fillStyle(style.accent, 1);
    g.fillTriangle(32, 18, 40, 44, 24, 44);
  } else if (style.kind === 'goblin') {
    g.fillStyle(style.fill, 1);
    g.fillTriangle(24, 8, 40, 8, 32, 22);
    g.fillRoundedRect(10, 18, 28, 24, 3);
    g.fillStyle(style.accent, 1);
    g.fillCircle(18, 26, 3);
    g.fillCircle(30, 26, 3);
  } else if (style.kind === 'archer') {
    g.fillStyle(style.fill, 1);
    g.fillRoundedRect(16, 10, 16, 32, 3);
    g.lineStyle(3, style.accent, 1);
    g.strokeCircle(34, 24, 12);
    g.lineBetween(22, 24, 46, 24);
  } else if (style.kind === 'brute') {
    g.fillStyle(style.fill, 1);
    g.fillRoundedRect(8, 16, 64, 56, 6);
    g.fillStyle(style.accent, 1);
    g.fillRect(28, 8, 24, 14);
  } else if (style.kind === 'boss') {
    g.fillStyle(style.fill, 1);
    g.fillRoundedRect(12, 18, 72, 70, 8);
    g.fillStyle(style.accent, 1);
    g.fillCircle(48, 48, 14);
    g.lineStyle(3, style.accent, 0.9);
    g.strokeCircle(48, 48, 22);
    g.strokeCircle(48, 48, 30);
  } else if (style.kind === 'bolt') {
    g.fillStyle(style.fill, 1);
    g.fillCircle(12, 12, 8);
    g.fillStyle(style.accent, 1);
    g.fillCircle(12, 12, 4);
  } else if (style.kind === 'fire') {
    g.fillStyle(style.fill, 1);
    g.fillCircle(14, 16, 10);
    g.fillTriangle(6, 14, 14, 2, 22, 14);
  } else if (style.kind === 'arrow') {
    g.fillStyle(style.accent, 1);
    g.fillRect(4, 10, 16, 4);
    g.fillStyle(style.fill, 1);
    g.fillTriangle(18, 6, 24, 12, 18, 18);
  } else {
    g.fillStyle(style.fill, 1);
    g.fillCircle(14, 14, 10);
    g.fillStyle(style.accent, 0.8);
    g.fillCircle(14, 14, 5);
  }

  g.generateTexture(style.key, size, size);
  g.destroy();
}
