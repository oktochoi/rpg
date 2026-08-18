import type * as Phaser from 'phaser';
import { getBossAsset } from './asset-registry';
import { COMBAT_DEPTH } from './combat-depth';
import { SpriteActorVisual, type ActorVisualState } from './SpriteActorVisual';

export class BossVisual {
  private readonly actor: SpriteActorVisual;
  private readonly aura: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, bossId: string, bodySize: number) {
    const asset = getBossAsset(bossId);
    this.actor = new SpriteActorVisual(scene, asset, bodySize, 'boss');
    this.aura = scene.add.circle(0, 0, Math.max(bodySize * 0.85, asset.visualSize * 0.38), 0xf0d080, 0);
    this.aura.setStrokeStyle(2, 0xf0d080, 0.35);
    this.aura.setDepth(COMBAT_DEPTH.character - 0.1);
  }

  update(state: ActorVisualState): void {
    this.actor.update(state);
    this.aura.setPosition(state.x, state.y);
    this.aura.setVisible(!state.dead);
    if (state.phaseTransition || state.phase === 2) {
      this.aura.setStrokeStyle(3, 0xff88cc, 0.55 + Math.sin(performance.now() / 140) * 0.2);
      this.aura.setScale(state.phaseTransition ? 1.25 : 1.15);
    } else if (state.bossPattern === 'projectile_burst') {
      this.aura.setStrokeStyle(3, 0xc080ff, 0.5);
      this.aura.setScale(1.1);
    } else {
      this.aura.setStrokeStyle(2, 0xf0d080, 0.28);
      this.aura.setScale(1);
    }
  }

  destroy(): void {
    this.aura.destroy();
    this.actor.destroy();
  }
}
