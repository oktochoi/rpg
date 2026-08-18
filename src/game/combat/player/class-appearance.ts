import type { PlayerClassId } from '../../player/classes/class-types';

export interface ClassAppearance {
  classId: PlayerClassId;
  shape: 'rect' | 'circle';
  size: number;
  color: number;
  label: string;
}

export const CLASS_APPEARANCE: Readonly<Record<PlayerClassId, ClassAppearance>> = {
  adventurer: {
    classId: 'adventurer',
    shape: 'rect',
    size: 32,
    color: 0xb8a078,
    label: 'ADVENTURER',
  },
  warrior: {
    classId: 'warrior',
    shape: 'rect',
    size: 36,
    color: 0xc4a574,
    label: 'WARRIOR',
  },
  mage: {
    classId: 'mage',
    shape: 'circle',
    size: 26,
    color: 0x6b8cce,
    label: 'MAGE',
  },
  rogue: {
    classId: 'rogue',
    shape: 'rect',
    size: 24,
    color: 0x8b9198,
    label: 'ROGUE',
  },
};

export function getClassAppearance(classId: PlayerClassId): ClassAppearance {
  return CLASS_APPEARANCE[classId];
}
