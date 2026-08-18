import * as Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';
import { isCombatHitboxDebug } from './visual/hitbox-debug';
import type { CombatConfig } from './types/combat-config';

export const COMBAT_CONFIG_REGISTRY_KEY = 'combatConfig';

export function startCombatGame(parent: string, combatConfig: CombatConfig): Phaser.Game {
  const parentElement = document.getElementById(parent);
  const width = parentElement?.clientWidth || window.innerWidth;
  const height = parentElement?.clientHeight || window.innerHeight;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: '#1a1612',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: isCombatHitboxDebug(),
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent,
    },
    scene: [],
  };

  const game = new Phaser.Game(config);
  game.registry.set(COMBAT_CONFIG_REGISTRY_KEY, combatConfig);
  game.scene.add('CombatScene', CombatScene, true);
  return game;
}
