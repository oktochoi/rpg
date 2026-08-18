import type { VisualAnimState } from './asset-types';

export interface AnimationPriorityInput {
  dead?: boolean;
  hit?: boolean;
  guarding?: boolean;
  skillSlot?: 'Q' | 'E' | null;
  attacking?: boolean;
  attackActive?: boolean;
  dashing?: boolean;
  moving?: boolean;
  phaseTransition?: boolean;
  bossPattern?: 'heavy_slam' | 'projectile_burst' | 'charge' | null;
}

export function resolvePlayerAnim(input: AnimationPriorityInput): VisualAnimState {
  if (input.dead) {
    return 'death';
  }
  if (input.hit) {
    return 'hit';
  }
  if (input.skillSlot === 'Q') {
    return 'skill1';
  }
  if (input.skillSlot === 'E') {
    return 'skill2';
  }
  if (input.guarding) {
    return 'guard';
  }
  if (input.attacking) {
    return input.attackActive ? 'attack' : 'attack_windup';
  }
  if (input.dashing) {
    return 'dash';
  }
  if (input.moving) {
    return 'walk';
  }
  return 'idle';
}

export function resolveEnemyAnim(input: AnimationPriorityInput): VisualAnimState {
  if (input.dead) {
    return 'death';
  }
  if (input.hit) {
    return 'hit';
  }
  if (input.attacking) {
    return input.attackActive ? 'attack' : 'attack_windup';
  }
  if (input.dashing) {
    return 'dash';
  }
  if (input.moving) {
    return 'walk';
  }
  return 'idle';
}

export function resolveBossAnim(input: AnimationPriorityInput): VisualAnimState {
  if (input.dead) {
    return 'death';
  }
  if (input.phaseTransition) {
    return 'phase_transition';
  }
  if (input.hit) {
    return 'hit';
  }
  if (input.bossPattern === 'heavy_slam') {
    return input.attackActive ? 'slam' : 'attack_windup';
  }
  if (input.bossPattern === 'projectile_burst') {
    return 'burst';
  }
  if (input.bossPattern === 'charge') {
    return input.attackActive ? 'walk' : 'idle';
  }
  if (input.attacking) {
    return input.attackActive ? 'attack' : 'attack_windup';
  }
  if (input.moving) {
    return 'walk';
  }
  return 'idle';
}
