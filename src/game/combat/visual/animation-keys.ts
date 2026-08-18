import type { VisualAnimState } from './asset-types';

export const ANIMATION_FRAME_RATE = {
  idle: 6,
  walk: 8,
  attack: 12,
  attack_windup: 8,
  dash: 14,
  skill1: 12,
  skill2: 10,
  hit: 14,
  death: 8,
  guard: 8,
  phase_transition: 8,
  slam: 10,
  burst: 10,
  charge: 12,
} as const satisfies Record<VisualAnimState, number>;

export function animationKey(kind: 'player' | 'enemy' | 'boss', id: string, state: VisualAnimState): string {
  return `${kind}_${id}_${state}`;
}

export function stateTextureKey(textureKey: string, state: VisualAnimState): string {
  return `${textureKey}_${state}`;
}

export function sequenceTextureKey(textureKey: string, state: VisualAnimState, index: number): string {
  return `${textureKey}_${state}_${index}`;
}
