import * as Phaser from 'phaser';
import type { GameAssetDefinition, VisualAnimState } from './asset-types';
import { CombatAssetLoader } from './CombatAssetLoader';
import { cardinalFromVector, COMBAT_DEPTH, type CardinalFacing } from './combat-depth';
import { SpriteAnimationController } from './SpriteAnimationController';
import { resolveBossAnim, resolveEnemyAnim, resolvePlayerAnim } from './animation-priority';

export interface ActorVisualState {
  x: number;
  y: number;
  facingX: number;
  facingY: number;
  moving: boolean;
  dashing?: boolean;
  invincible?: boolean;
  hit?: boolean;
  dead?: boolean;
  deadT?: number;
  attacking?: boolean;
  attackActive?: boolean;
  phase?: 1 | 2;
  guarding?: boolean;
  skillSlot?: 'Q' | 'E' | null;
  blink?: boolean;
  shadowDash?: boolean;
  phaseTransition?: boolean;
  bossPattern?: 'heavy_slam' | 'projectile_burst' | 'charge' | null;
  delta?: number;
}

export class SpriteActorVisual {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly animator: SpriteAnimationController;
  private baseScale: number;
  private poseTime = 0;
  private poseState: VisualAnimState = 'idle';
  private usingPlaceholder = true;

  constructor(
    scene: Phaser.Scene,
    private readonly asset: GameAssetDefinition,
    private readonly bodySize: number,
    private readonly kind: 'player' | 'enemy' | 'boss'
  ) {
    const texture = CombatAssetLoader.resolveTexture(scene, asset);
    this.shadow = scene.add.ellipse(0, 0, asset.visualSize * 0.7 * asset.scale, asset.visualSize * 0.22 * asset.scale, 0x000000, 0.35);
    this.shadow.setDepth(COMBAT_DEPTH.shadow);
    this.sprite = scene.add.sprite(0, 0, texture);
    this.sprite.setOrigin(asset.originX, asset.originY);
    this.baseScale = this.computeBaseScale();
    this.sprite.setScale(this.baseScale);
    this.animator = new SpriteAnimationController(scene, this.sprite, kind, asset);
  }

  get facing(): CardinalFacing {
    return cardinalFromVector(this.sprite.flipX ? -1 : 1, 0);
  }

  update(state: ActorVisualState): void {
    const anim = this.resolveAnim(state);
    if (anim !== this.poseState) {
      this.poseState = anim;
      this.poseTime = 0;
    }
    this.poseTime += state.delta ?? 16;
    this.usingPlaceholder = !this.animator.play(anim);
    this.tryPromoteTexture();
    this.syncBaseScale();

    const offsetX = this.asset.visualOffsetX ?? 0;
    const offsetY = this.asset.visualOffsetY ?? 0;
    this.shadow.setPosition(state.x + offsetX, state.y + this.bodySize * 0.42 + offsetY);
    this.sprite.setPosition(
      state.x + offsetX,
      state.y + this.bodySize * (this.asset.originY - 0.5) + offsetY
    );
    this.sprite.setDepth(COMBAT_DEPTH.character + state.y * 0.001);
    this.shadow.setDepth(COMBAT_DEPTH.shadow + state.y * 0.001);

    if (state.facingX < -0.15) {
      this.sprite.setFlipX(true);
    } else if (state.facingX > 0.15) {
      this.sprite.setFlipX(false);
    }

    this.applyPose(state, anim);
  }

  destroy(): void {
    this.animator.destroy();
    this.sprite.destroy();
    this.shadow.destroy();
  }

  private resolveAnim(state: ActorVisualState): VisualAnimState {
    if (this.kind === 'player') {
      return resolvePlayerAnim(state);
    }
    if (this.kind === 'boss') {
      return resolveBossAnim(state);
    }
    return resolveEnemyAnim(state);
  }

  private tryPromoteTexture(): void {
    if (!this.sprite.scene.textures.exists(this.asset.textureKey)) {
      return;
    }
    if (this.sprite.texture.key === this.asset.fallbackKey) {
      this.sprite.setTexture(this.asset.textureKey);
      this.syncBaseScale();
    }
  }

  private sourceHeight(): number {
    const frameHeight = this.sprite.frame?.height ?? 0;
    return Math.max(frameHeight, 1);
  }

  private computeBaseScale(): number {
    return (this.asset.visualSize / this.sourceHeight()) * this.asset.scale;
  }

  private syncBaseScale(): void {
    this.baseScale = this.computeBaseScale();
  }

  private applyPose(state: ActorVisualState, anim: VisualAnimState): void {
    let scale = this.baseScale;
    let alpha = 1;
    let rotation = 0;

    if (state.phase === 2 && !state.dead) {
      scale *= 1.08 + Math.sin(performance.now() / 180) * 0.03;
      this.sprite.setTint(0xffc8e8);
    } else if (!state.hit) {
      this.sprite.clearTint();
    }

    if (this.usingPlaceholder) {
      if (anim === 'idle' && !state.dead) {
        scale *= 1 + Math.sin(this.poseTime / 240) * 0.03;
      } else if (anim === 'walk' && !state.dead) {
        this.sprite.y += Math.sin(this.poseTime / 70) * 1.6;
      } else if (anim === 'attack' || anim === 'attack_windup' || anim === 'skill1' || anim === 'slam') {
        scale *= 1.12 + Math.sin(this.poseTime / 40) * 0.04;
      } else if (anim === 'skill2' || anim === 'guard' || anim === 'burst') {
        scale *= 1.08;
      } else if (anim === 'dash' || anim === 'charge') {
        scale *= state.blink ? 0.82 : 1.18;
        alpha = state.shadowDash ? 0.45 : 0.7;
        rotation = this.sprite.flipX ? -0.12 : 0.12;
      } else if (anim === 'phase_transition') {
        scale *= 1.16 + Math.sin(this.poseTime / 90) * 0.06;
      }
    } else if (anim === 'walk' && !state.dead) {
      const period = this.kind === 'boss' ? 140 : 80;
      const amp = this.kind === 'boss' ? 0.8 : 1.2;
      this.sprite.y += Math.sin(this.poseTime / period) * amp;
      scale *= 1 + Math.sin(this.poseTime / period) * 0.02;
    } else if (state.bossPattern === 'charge' && !state.dead) {
      alpha = Math.min(alpha, 0.78);
      scale *= 1.04;
    }

    if (state.dead) {
      scale *= 1 - (state.deadT ?? 0) * 0.35;
      alpha = 1 - (state.deadT ?? 0) * 0.7;
      this.shadow.setAlpha(0.2);
    } else if (state.hit) {
      this.sprite.setTint(0xfff3ee);
      alpha = 1;
    } else if (state.invincible) {
      alpha = 0.45 + Math.sin(performance.now() / 50) * 0.25;
    } else if (state.dashing) {
      alpha = Math.min(alpha, state.shadowDash ? 0.4 : state.blink ? 0.35 : 0.7);
    }

    this.sprite.setAlpha(alpha);
    this.sprite.setScale(scale);
    this.sprite.setRotation(rotation);
    this.shadow.setVisible(!state.dead || (state.deadT ?? 0) < 0.9);
  }
}
