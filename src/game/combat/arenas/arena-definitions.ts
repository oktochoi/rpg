import { TEST_GOBLIN_ARENA_ID } from '../../story/test-scenes';
import { ARENA_ID, type CombatArenaDefinition } from './arena-types';

const FOREST_PALETTE = {
  ground: 0x243226,
  groundAccent: 0x2e4030,
  wall: 0x1a2418,
  obstacle: 0x3d4a32,
  decoration: 0x4a5c38,
  edge: 0x142018,
};

const CAMP_PALETTE = {
  ground: 0x32281e,
  groundAccent: 0x3c3024,
  wall: 0x241c16,
  obstacle: 0x6b4a2a,
  decoration: 0x8a5a32,
  edge: 0x1a140e,
};

const RUINS_PALETTE = {
  ground: 0x2a272e,
  groundAccent: 0x343038,
  wall: 0x3a363e,
  obstacle: 0x5c5864,
  decoration: 0x6e6874,
  edge: 0x1c1a20,
};

const GUARDIAN_PALETTE = {
  ground: 0x241e28,
  groundAccent: 0x2c2432,
  wall: 0x3a323c,
  obstacle: 0x53485c,
  decoration: 0x6b5480,
  edge: 0x161218,
};

function roomWalls(thickness = 0.07): CombatArenaDefinition['walls'] {
  return [
    { x: 0, y: 0, w: 1, h: thickness, kind: 'wall' },
    { x: 0, y: 1 - thickness, w: 1, h: thickness, kind: 'wall' },
    { x: 0, y: 0, w: thickness, h: 1, kind: 'wall' },
    { x: 1 - thickness, y: 0, w: thickness, h: 1, kind: 'wall' },
  ];
}

export const ARENA_DEFINITIONS: Record<string, CombatArenaDefinition> = {
  [ARENA_ID.FOREST_SCOUTS]: {
    id: ARENA_ID.FOREST_SCOUTS,
    logicalWidth: 860,
    logicalHeight: 540,
    playerSpawn: { x: 0.2, y: 0.52 },
    walls: roomWalls(0.065),
    obstacles: [
      { x: 0.28, y: 0.22, w: 0.1, h: 0.12, kind: 'tree' },
      { x: 0.68, y: 0.18, w: 0.11, h: 0.13, kind: 'tree' },
      { x: 0.48, y: 0.62, w: 0.12, h: 0.1, kind: 'rock' },
      { x: 0.72, y: 0.68, w: 0.09, h: 0.1, kind: 'tree' },
    ],
    decorations: [
      { x: 0.18, y: 0.72, w: 0.06, h: 0.05, kind: 'rock' },
      { x: 0.84, y: 0.3, w: 0.05, h: 0.06, kind: 'rock' },
    ],
    palette: FOREST_PALETTE,
  },
  [ARENA_ID.FOREST_AMBUSH]: {
    id: ARENA_ID.FOREST_AMBUSH,
    logicalWidth: 780,
    logicalHeight: 500,
    playerSpawn: { x: 0.2, y: 0.5 },
    walls: roomWalls(0.07),
    obstacles: [
      { x: 0.42, y: 0.38, w: 0.16, h: 0.18, kind: 'rock' },
      { x: 0.26, y: 0.2, w: 0.1, h: 0.12, kind: 'tree' },
      { x: 0.58, y: 0.66, w: 0.14, h: 0.1, kind: 'cart' },
      { x: 0.78, y: 0.22, w: 0.08, h: 0.16, kind: 'tree' },
    ],
    decorations: [
      { x: 0.16, y: 0.7, w: 0.05, h: 0.05, kind: 'rock' },
      { x: 0.7, y: 0.16, w: 0.05, h: 0.05, kind: 'rock' },
    ],
    palette: FOREST_PALETTE,
  },
  [ARENA_ID.GOBLIN_CAMP]: {
    id: ARENA_ID.GOBLIN_CAMP,
    logicalWidth: 900,
    logicalHeight: 580,
    playerSpawn: { x: 0.16, y: 0.5 },
    observedPlayerSpawn: { x: 0.22, y: 0.28 },
    walls: roomWalls(0.06),
    obstacles: [
      { x: 0.3, y: 0.18, w: 0.08, h: 0.22, kind: 'palisade' },
      { x: 0.3, y: 0.62, w: 0.08, h: 0.2, kind: 'palisade' },
      { x: 0.52, y: 0.14, w: 0.12, h: 0.1, kind: 'crate' },
      { x: 0.52, y: 0.76, w: 0.12, h: 0.1, kind: 'crate' },
      { x: 0.74, y: 0.2, w: 0.08, h: 0.18, kind: 'palisade' },
      { x: 0.74, y: 0.64, w: 0.08, h: 0.18, kind: 'palisade' },
    ],
    decorations: [
      { x: 0.46, y: 0.44, w: 0.08, h: 0.08, kind: 'fire' },
      { x: 0.62, y: 0.3, w: 0.1, h: 0.1, kind: 'tent' },
      { x: 0.62, y: 0.58, w: 0.1, h: 0.1, kind: 'tent' },
    ],
    palette: CAMP_PALETTE,
  },
  [ARENA_ID.RUINS_ENTRANCE]: {
    id: ARENA_ID.RUINS_ENTRANCE,
    logicalWidth: 840,
    logicalHeight: 540,
    playerSpawn: { x: 0.18, y: 0.52 },
    walls: roomWalls(0.075),
    obstacles: [
      { x: 0.34, y: 0.22, w: 0.08, h: 0.2, kind: 'pillar' },
      { x: 0.34, y: 0.6, w: 0.08, h: 0.2, kind: 'pillar' },
      { x: 0.58, y: 0.4, w: 0.1, h: 0.12, kind: 'statue' },
      { x: 0.74, y: 0.18, w: 0.1, h: 0.1, kind: 'rubble' },
      { x: 0.72, y: 0.7, w: 0.1, h: 0.1, kind: 'rubble' },
    ],
    decorations: [
      { x: 0.2, y: 0.22, w: 0.06, h: 0.05, kind: 'debris' },
      { x: 0.82, y: 0.48, w: 0.05, h: 0.06, kind: 'debris' },
    ],
    palette: RUINS_PALETTE,
  },
  [ARENA_ID.RUINS_GUARDIAN]: {
    id: ARENA_ID.RUINS_GUARDIAN,
    logicalWidth: 820,
    logicalHeight: 560,
    playerSpawn: { x: 0.2, y: 0.72 },
    walls: [
      ...roomWalls(0.085),
      { x: 0.08, y: 0.08, w: 0.16, h: 0.1, kind: 'wall' },
      { x: 0.76, y: 0.08, w: 0.16, h: 0.1, kind: 'wall' },
    ],
    obstacles: [
      { x: 0.2, y: 0.22, w: 0.08, h: 0.16, kind: 'pillar' },
      { x: 0.72, y: 0.22, w: 0.08, h: 0.16, kind: 'pillar' },
      { x: 0.18, y: 0.68, w: 0.09, h: 0.1, kind: 'rubble' },
      { x: 0.74, y: 0.7, w: 0.09, h: 0.1, kind: 'rubble' },
      { x: 0.46, y: 0.58, w: 0.08, h: 0.07, kind: 'debris' },
    ],
    decorations: [{ x: 0.44, y: 0.16, w: 0.12, h: 0.08, kind: 'altar' }],
    palette: GUARDIAN_PALETTE,
  },
};

ARENA_DEFINITIONS[TEST_GOBLIN_ARENA_ID] = ARENA_DEFINITIONS[ARENA_ID.RUINS_ENTRANCE];

export function getArenaDefinition(arenaId: string): CombatArenaDefinition {
  return ARENA_DEFINITIONS[arenaId] ?? ARENA_DEFINITIONS[ARENA_ID.FOREST_SCOUTS];
}
