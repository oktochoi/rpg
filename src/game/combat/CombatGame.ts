import * as Phaser from 'phaser';
import { CombatScene } from './scenes/CombatScene';

export function startCombatGame(parent: string): Phaser.Game {
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
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent,
    },
    scene: [CombatScene],
  };

  return new Phaser.Game(config);
}
