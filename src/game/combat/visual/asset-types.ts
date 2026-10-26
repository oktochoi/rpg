export type GameAssetType =
  | 'player'
  | 'enemy'
  | 'boss'
  | 'npc'
  | 'skill'
  | 'projectile'
  | 'background'
  | 'effect';

export type VisualAnimState =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'attack_windup'
  | 'dash'
  | 'skill1'
  | 'skill2'
  | 'hit'
  | 'death'
  | 'guard'
  | 'phase_transition'
  | 'slam'
  | 'burst'
  | 'charge';

export interface SpriteAnimationDefinition {
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
}

export type SpriteSourceKind = 'image' | 'spritesheet';

export interface GameAssetDefinition {
  id: string;
  type: GameAssetType;
  textureKey: string;
  path: string;
  fallbackKey: string;
  scale: number;
  originX: number;
  originY: number;
  visualSize: number;
  sourceKind?: SpriteSourceKind;
  frameWidth?: number;
  frameHeight?: number;
  visualOffsetX?: number;
  visualOffsetY?: number;
  /** When true, the spritesheet art faces left at rest (flipX=false). */
  artFacesLeft?: boolean;
  hpBarOffsetY?: number;
  damageTextOffsetY?: number;
  stateTextures?: Partial<Record<VisualAnimState, string>>;
  framePaths?: Partial<Record<VisualAnimState, readonly string[]>>;
  sequenceFrameRate?: Partial<Record<VisualAnimState, number>>;
  animations?: Partial<Record<VisualAnimState, SpriteAnimationDefinition>>;
  portraitPath?: string;
  skillEffectPath?: string;
}

export interface PlaceholderStyle {
  key: string;
  size: number;
  fill: number;
  accent: number;
  kind: 'warrior' | 'mage' | 'rogue' | 'adventurer' | 'goblin' | 'archer' | 'brute' | 'boss' | 'bolt' | 'fire' | 'arrow' | 'arcane';
}

export interface EffectAssetDefinition {
  id: string;
  textureKey: string;
  path: string;
  fallbackKey: string;
}
