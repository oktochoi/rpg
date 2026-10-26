import type { Rect } from '../arenas/arena-geometry';
import { circleHitsRect } from '../arenas/arena-geometry';

export const NAV_CELL_SIZE = 32;
const CLEARANCE = 12;

export interface NavGrid {
  originX: number;
  originY: number;
  cellSize: number;
  cols: number;
  rows: number;
  /** 0 walkable, 1 blocked. Row-major. */
  cells: Uint8Array;
}

export interface NavPoint {
  x: number;
  y: number;
}

export function buildNavGrid(
  bounds: { x: number; y: number; width: number; height: number },
  solids: readonly Rect[],
  cellSize = NAV_CELL_SIZE,
  contains: ((x: number, y: number) => boolean) | undefined = undefined
): NavGrid {
  const cols = Math.max(2, Math.floor(bounds.width / cellSize));
  const rows = Math.max(2, Math.floor(bounds.height / cellSize));
  const cells = new Uint8Array(cols * rows);
  const grid: NavGrid = {
    originX: bounds.x,
    originY: bounds.y,
    cellSize,
    cols,
    rows,
    cells,
  };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const center = cellCenter(grid, col, row);
      const outside = contains ? !contains(center.x, center.y) : false;
      const blocked =
        outside ||
        solids.some((solid) => circleHitsRect({ x: center.x, y: center.y, radius: CLEARANCE }, solid));
      cells[row * cols + col] = blocked ? 1 : 0;
    }
  }
  return grid;
}

export function cellIndex(grid: NavGrid, col: number, row: number): number {
  return row * grid.cols + col;
}

export function inGrid(grid: NavGrid, col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < grid.cols && row < grid.rows;
}

export function isWalkable(grid: NavGrid, col: number, row: number): boolean {
  return inGrid(grid, col, row) && grid.cells[cellIndex(grid, col, row)] === 0;
}

export function worldToCell(grid: NavGrid, x: number, y: number): { col: number; row: number } {
  return {
    col: Math.max(0, Math.min(grid.cols - 1, Math.floor((x - grid.originX) / grid.cellSize))),
    row: Math.max(0, Math.min(grid.rows - 1, Math.floor((y - grid.originY) / grid.cellSize))),
  };
}

export function cellCenter(grid: NavGrid, col: number, row: number): NavPoint {
  return {
    x: grid.originX + (col + 0.5) * grid.cellSize,
    y: grid.originY + (row + 0.5) * grid.cellSize,
  };
}

export function nearestWalkable(grid: NavGrid, col: number, row: number): { col: number; row: number } | null {
  if (isWalkable(grid, col, row)) {
    return { col, row };
  }
  const maxRing = Math.max(grid.cols, grid.rows);
  for (let ring = 1; ring <= maxRing; ring += 1) {
    for (let dy = -ring; dy <= ring; dy += 1) {
      for (let dx = -ring; dx <= ring; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) {
          continue;
        }
        if (isWalkable(grid, col + dx, row + dy)) {
          return { col: col + dx, row: row + dy };
        }
      }
    }
  }
  return null;
}

/** Grid line of sight. Diagonal steps cannot clip a blocked corner. */
export function cellsHaveSight(grid: NavGrid, col0: number, row0: number, col1: number, row1: number): boolean {
  if (!isWalkable(grid, col0, row0) || !isWalkable(grid, col1, row1)) {
    return false;
  }
  let col = col0;
  let row = row0;
  const dx = Math.abs(col1 - col0);
  const dy = Math.abs(row1 - row0);
  const stepX = col0 < col1 ? 1 : -1;
  const stepY = row0 < row1 ? 1 : -1;
  let err = dx - dy;
  while (col !== col1 || row !== row1) {
    const doubled = err * 2;
    const moveX = doubled > -dy;
    const moveY = doubled < dx;
    if (moveX) {
      err -= dy;
      col += stepX;
    }
    if (moveY) {
      err += dx;
      row += stepY;
    }
    if (moveX && moveY) {
      if (!isWalkable(grid, col - stepX, row) || !isWalkable(grid, col, row - stepY)) {
        return false;
      }
    }
    if (!isWalkable(grid, col, row)) {
      return false;
    }
  }
  return true;
}

export function worldHasSight(grid: NavGrid, from: NavPoint, to: NavPoint): boolean {
  const a = worldToCell(grid, from.x, from.y);
  const b = worldToCell(grid, to.x, to.y);
  return cellsHaveSight(grid, a.col, a.row, b.col, b.row);
}

const RING_DISTANCES = [0, 0.5, 1];

/** A walkable cell that can see the player, near the preferred ring. */
export function findLosAnchor(
  grid: NavGrid,
  from: NavPoint,
  player: NavPoint,
  minDist: number,
  preferred: number,
  maxDist: number,
  angleBias: number
): NavPoint | null {
  let best: NavPoint | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const samples = 12;
  for (let i = 0; i < samples; i += 1) {
    const angle = angleBias + (i / samples) * Math.PI * 2;
    for (const scale of RING_DISTANCES) {
      const dist = scale === 0 ? preferred : scale < 1 ? (minDist + preferred) * 0.5 : Math.min(maxDist, preferred + grid.cellSize * 3);
      const point = {
        x: player.x + Math.cos(angle) * dist,
        y: player.y + Math.sin(angle) * dist,
      };
      const cell = worldToCell(grid, point.x, point.y);
      if (!isWalkable(grid, cell.col, cell.row)) {
        continue;
      }
      const center = cellCenter(grid, cell.col, cell.row);
      if (!worldHasSight(grid, center, player)) {
        continue;
      }
      const travel = Math.hypot(center.x - from.x, center.y - from.y);
      const band = Math.abs(Math.hypot(center.x - player.x, center.y - player.y) - preferred);
      const score = travel + band * 0.35;
      if (score < bestScore) {
        best = center;
        bestScore = score;
      }
    }
  }
  return best;
}
