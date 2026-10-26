export const ARENA_ID = {
  FOREST_SCOUTS: 'forest_scouts_arena',
  FOREST_AMBUSH: 'forest_ambush_arena',
  GOBLIN_CAMP: 'goblin_camp_arena',
  RUINS_ENTRANCE: 'ruins_entrance',
  RUINS_GUARDIAN: 'ruins_guardian_arena',
  TRAINING_YARD: 'training_yard_arena',
} as const;

export type ArenaId = (typeof ARENA_ID)[keyof typeof ARENA_ID];

export type ArenaFeatureKind =
  | 'wall'
  | 'tree'
  | 'rock'
  | 'cart'
  | 'crate'
  | 'palisade'
  | 'tent'
  | 'fire'
  | 'pillar'
  | 'statue'
  | 'rubble'
  | 'altar'
  | 'debris';

export interface ArenaRectNorm {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ArenaFeatureKind;
}

export interface ArenaPalette {
  ground: number;
  groundAccent: number;
  wall: number;
  obstacle: number;
  decoration: number;
  edge: number;
}

export interface CombatArenaDefinition {
  id: ArenaId;
  logicalWidth: number;
  logicalHeight: number;
  playerSpawn: { x: number; y: number };
  observedPlayerSpawn?: { x: number; y: number };
  walls: readonly ArenaRectNorm[];
  obstacles: readonly ArenaRectNorm[];
  decorations: readonly ArenaRectNorm[];
  palette: ArenaPalette;
}

export interface ArenaWorldRect {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ArenaFeatureKind;
  collision: boolean;
}

export interface ArenaLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface ArenaRuntimeView {
  id: ArenaId;
  layout: ArenaLayout;
  solids: readonly ArenaWorldRect[];
  decorations: readonly ArenaWorldRect[];
  playerSpawn: { x: number; y: number };
  innerBounds: { left: number; top: number; right: number; bottom: number };
}
