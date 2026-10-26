import { TEST_GOBLIN_ARENA_ID } from '../../story/test-scenes';
import { ARENA_ID, type CombatArenaDefinition } from './arena-types';

const FOREST_PALETTE = {
  ground: 0x2a3e2c,
  groundAccent: 0x3a5440,
  wall: 0x1c2c1c,
  obstacle: 0x3d4a32,
  decoration: 0x4a5c38,
  edge: 0x101810,
};

const CAMP_PALETTE = {
  ground: 0x3a2e22,
  groundAccent: 0x4a3a28,
  wall: 0x2a2018,
  obstacle: 0x6b4a2a,
  decoration: 0x8a5a32,
  edge: 0x16100c,
};

const RUINS_PALETTE = {
  ground: 0x343038,
  groundAccent: 0x4a4452,
  wall: 0x4a4450,
  obstacle: 0x6a6574,
  decoration: 0x7e7886,
  edge: 0x1a1820,
};

const GUARDIAN_PALETTE = {
  ground: 0x2c2434,
  groundAccent: 0x3a2e44,
  wall: 0x443848,
  obstacle: 0x5c4c68,
  decoration: 0x7a60a0,
  edge: 0x140e18,
};

function roomWalls(thickness = 0.02): CombatArenaDefinition['walls'] {
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
    logicalWidth: 1080,
    logicalHeight: 680,
    playerSpawn: { x: 0.2, y: 0.52 },
    walls: roomWalls(),
    obstacles: [
      { x: 0.06, y: 0.5, w: 0.08, h: 0.16, kind: 'tree' },
      { x: 0.86, y: 0.48, w: 0.08, h: 0.16, kind: 'tree' },
      { x: 0.6, y: 0.66, w: 0.08, h: 0.08, kind: 'rock' },
      { x: 0.08, y: 0.72, w: 0.08, h: 0.14, kind: 'tree' },
    ],
    decorations: [
      { x: 0.84, y: 0.7, w: 0.06, h: 0.06, kind: 'rock' },
      { x: 0.16, y: 0.64, w: 0.05, h: 0.05, kind: 'rock' },
      { x: 0.9, y: 0.58, w: 0.07, h: 0.14, kind: 'tree' },
      { x: 0.02, y: 0.6, w: 0.07, h: 0.14, kind: 'tree' },
    ],
    palette: FOREST_PALETTE,
  },
  [ARENA_ID.FOREST_AMBUSH]: {
    id: ARENA_ID.FOREST_AMBUSH,
    logicalWidth: 1000,
    logicalHeight: 640,
    playerSpawn: { x: 0.2, y: 0.5 },
    walls: roomWalls(),
    obstacles: [
      { x: 0.18, y: 0.58, w: 0.1, h: 0.12, kind: 'rock' },
      { x: 0.04, y: 0.52, w: 0.08, h: 0.16, kind: 'tree' },
      { x: 0.64, y: 0.68, w: 0.12, h: 0.1, kind: 'cart' },
      { x: 0.88, y: 0.5, w: 0.08, h: 0.16, kind: 'tree' },
    ],
    decorations: [
      { x: 0.14, y: 0.72, w: 0.05, h: 0.05, kind: 'rock' },
      { x: 0.82, y: 0.66, w: 0.05, h: 0.05, kind: 'rock' },
      { x: 0.9, y: 0.7, w: 0.07, h: 0.12, kind: 'tree' },
      { x: 0.02, y: 0.68, w: 0.07, h: 0.12, kind: 'tree' },
    ],
    palette: FOREST_PALETTE,
  },
  [ARENA_ID.GOBLIN_CAMP]: {
    id: ARENA_ID.GOBLIN_CAMP,
    logicalWidth: 1120,
    logicalHeight: 720,
    playerSpawn: { x: 0.16, y: 0.5 },
    observedPlayerSpawn: { x: 0.22, y: 0.28 },
    walls: roomWalls(),
    obstacles: [
      { x: 0.04, y: 0.48, w: 0.08, h: 0.2, kind: 'palisade' },
      { x: 0.06, y: 0.7, w: 0.08, h: 0.16, kind: 'palisade' },
      { x: 0.16, y: 0.46, w: 0.1, h: 0.1, kind: 'crate' },
      { x: 0.82, y: 0.68, w: 0.1, h: 0.1, kind: 'crate' },
      { x: 0.88, y: 0.46, w: 0.08, h: 0.18, kind: 'palisade' },
      { x: 0.86, y: 0.66, w: 0.08, h: 0.16, kind: 'palisade' },
    ],
    decorations: [
      { x: 0.48, y: 0.62, w: 0.07, h: 0.07, kind: 'fire' },
      { x: 0.08, y: 0.56, w: 0.1, h: 0.1, kind: 'tent' },
      { x: 0.8, y: 0.52, w: 0.1, h: 0.1, kind: 'tent' },
      { x: 0.2, y: 0.7, w: 0.05, h: 0.05, kind: 'crate' },
      { x: 0.9, y: 0.58, w: 0.05, h: 0.06, kind: 'rock' },
    ],
    palette: CAMP_PALETTE,
  },
  [ARENA_ID.RUINS_ENTRANCE]: {
    id: ARENA_ID.RUINS_ENTRANCE,
    logicalWidth: 1100,
    logicalHeight: 700,
    playerSpawn: { x: 0.18, y: 0.52 },
    walls: roomWalls(),
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
      { x: 0.48, y: 0.74, w: 0.08, h: 0.06, kind: 'rubble' },
      { x: 0.64, y: 0.22, w: 0.06, h: 0.05, kind: 'debris' },
    ],
    palette: RUINS_PALETTE,
  },
  [ARENA_ID.RUINS_GUARDIAN]: {
    id: ARENA_ID.RUINS_GUARDIAN,
    logicalWidth: 1080,
    logicalHeight: 720,
    playerSpawn: { x: 0.2, y: 0.72 },
    walls: [
      ...roomWalls(),
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
    decorations: [
      { x: 0.44, y: 0.16, w: 0.12, h: 0.08, kind: 'altar' },
      { x: 0.34, y: 0.46, w: 0.05, h: 0.05, kind: 'debris' },
      { x: 0.6, y: 0.3, w: 0.05, h: 0.05, kind: 'rubble' },
    ],
    palette: GUARDIAN_PALETTE,
  },
  [ARENA_ID.TRAINING_YARD]: {
    id: ARENA_ID.TRAINING_YARD,
    logicalWidth: 960,
    logicalHeight: 620,
    playerSpawn: { x: 0.22, y: 0.52 },
    walls: roomWalls(),
    obstacles: [{ x: 0.14, y: 0.74, w: 0.1, h: 0.08, kind: 'crate' }],
    decorations: [{ x: 0.78, y: 0.76, w: 0.06, h: 0.05, kind: 'debris' }],
    palette: {
      ground: 0x3a342c,
      groundAccent: 0x4a4238,
      wall: 0x2a2620,
      obstacle: 0x6a5a48,
      decoration: 0x7a6a52,
      edge: 0x161410,
    },
  },
};

ARENA_DEFINITIONS[TEST_GOBLIN_ARENA_ID] = ARENA_DEFINITIONS[ARENA_ID.RUINS_ENTRANCE];

export function getArenaDefinition(arenaId: string): CombatArenaDefinition {
  return ARENA_DEFINITIONS[arenaId] ?? ARENA_DEFINITIONS[ARENA_ID.FOREST_SCOUTS];
}
