/**
 * Walkable floor for each 2.5D combat plate.
 * Coordinates are fractions of the 1920×1080 painting, not the whole window.
 * The far edge is narrower so the tree line, fence, and stairs stay out of reach.
 */

export type CombatGroundTheme = 'forest' | 'camp' | 'ruins' | 'guardian' | 'yard';

export interface WalkTrapezoid {
  /** Image v where the floor starts. Above this is sky, canopy, stairs, or a fence. */
  top: number;
  /** Image v of the near edge. */
  bottom: number;
  /** Horizontal inset at the far edge. Larger means a narrower path. */
  topInset: number;
  /** Horizontal inset at the near edge. */
  bottomInset: number;
}

export interface PlateFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WalkableArea {
  theme: CombatGroundTheme;
  trapezoid: WalkTrapezoid;
  frame: PlateFrame;
  aabb: { x: number; y: number; width: number; height: number };
}

const PLATE_WIDTH = 1920;
const PLATE_HEIGHT = 1080;
const PLATE_BLEED = 8;

export const WALKABLE_TRAPEZOIDS: Record<CombatGroundTheme, WalkTrapezoid> = {
  forest: { top: 0.43, bottom: 0.84, topInset: 0.3, bottomInset: 0.14 },
  camp: { top: 0.46, bottom: 0.84, topInset: 0.18, bottomInset: 0.18 },
  ruins: { top: 0.44, bottom: 0.82, topInset: 0.12, bottomInset: 0.14 },
  guardian: { top: 0.52, bottom: 0.84, topInset: 0.16, bottomInset: 0.14 },
  yard: { top: 0.42, bottom: 0.82, topInset: 0.1, bottomInset: 0.16 },
};

export function plateFrame(canvasWidth: number, canvasHeight: number): PlateFrame {
  const scale = Math.max(canvasWidth / PLATE_WIDTH, canvasHeight / PLATE_HEIGHT);
  const width = PLATE_WIDTH * scale + PLATE_BLEED;
  const height = PLATE_HEIGHT * scale + PLATE_BLEED;
  return {
    left: (canvasWidth - width) / 2,
    top: (canvasHeight - height) / 2,
    width,
    height,
  };
}

export function createWalkableArea(
  theme: CombatGroundTheme,
  canvasWidth: number,
  canvasHeight: number
): WalkableArea {
  const trapezoid = WALKABLE_TRAPEZOIDS[theme];
  const frame = plateFrame(canvasWidth, canvasHeight);
  const corners = [
    imageToWorld(trapezoid.topInset, trapezoid.top, frame),
    imageToWorld(1 - trapezoid.topInset, trapezoid.top, frame),
    imageToWorld(trapezoid.bottomInset, trapezoid.bottom, frame),
    imageToWorld(1 - trapezoid.bottomInset, trapezoid.bottom, frame),
  ];
  const left = Math.min(...corners.map((point) => point.x));
  const right = Math.max(...corners.map((point) => point.x));
  const top = Math.min(...corners.map((point) => point.y));
  const bottom = Math.max(...corners.map((point) => point.y));
  return {
    theme,
    trapezoid,
    frame,
    aabb: { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) },
  };
}

export function walkableContains(area: WalkableArea, x: number, y: number, radius = 0): boolean {
  const point = worldToImage(x, y, area.frame);
  const ru = radius / Math.max(1, area.frame.width);
  const rv = radius / Math.max(1, area.frame.height);
  const trap = area.trapezoid;
  if (point.v < trap.top + rv || point.v > trap.bottom - rv) {
    return false;
  }
  const inset = insetAt(trap, point.v);
  return point.u >= inset + ru && point.u <= 1 - inset - ru;
}

export function clampToWalkable(
  area: WalkableArea,
  x: number,
  y: number,
  radius = 0
): { x: number; y: number } {
  const trap = area.trapezoid;
  const ru = radius / Math.max(1, area.frame.width);
  const rv = radius / Math.max(1, area.frame.height);
  const point = worldToImage(x, y, area.frame);
  const v = Math.min(trap.bottom - rv, Math.max(trap.top + rv, point.v));
  const inset = insetAt(trap, v);
  const innerLeft = inset + ru;
  const innerRight = 1 - inset - ru;
  const u = innerRight <= innerLeft ? 0.5 : Math.min(innerRight, Math.max(innerLeft, point.u));
  return imageToWorld(u, v, area.frame);
}

function insetAt(trap: WalkTrapezoid, v: number): number {
  const span = Math.max(0.001, trap.bottom - trap.top);
  const t = Math.min(1, Math.max(0, (v - trap.top) / span));
  return trap.topInset + (trap.bottomInset - trap.topInset) * t;
}

function imageToWorld(u: number, v: number, frame: PlateFrame): { x: number; y: number } {
  return {
    x: frame.left + u * frame.width,
    y: frame.top + v * frame.height,
  };
}

function worldToImage(x: number, y: number, frame: PlateFrame): { u: number; v: number } {
  return {
    u: (x - frame.left) / Math.max(1, frame.width),
    v: (y - frame.top) / Math.max(1, frame.height),
  };
}
