import {
  cellCenter,
  cellIndex,
  cellsHaveSight,
  inGrid,
  isWalkable,
  nearestWalkable,
  worldToCell,
  type NavGrid,
  type NavPoint,
} from './navigation-grid';

const SQRT2 = Math.SQRT2;
const DIRS: readonly { col: number; row: number; cost: number }[] = [
  { col: 1, row: 0, cost: 1 },
  { col: -1, row: 0, cost: 1 },
  { col: 0, row: 1, cost: 1 },
  { col: 0, row: -1, cost: 1 },
  { col: 1, row: 1, cost: SQRT2 },
  { col: 1, row: -1, cost: SQRT2 },
  { col: -1, row: 1, cost: SQRT2 },
  { col: -1, row: -1, cost: SQRT2 },
];

function octile(col: number, row: number, goalCol: number, goalRow: number): number {
  const dx = Math.abs(goalCol - col);
  const dy = Math.abs(goalRow - row);
  return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
}

function canStep(grid: NavGrid, col: number, row: number, dir: { col: number; row: number }): boolean {
  const nextCol = col + dir.col;
  const nextRow = row + dir.row;
  if (!isWalkable(grid, nextCol, nextRow)) {
    return false;
  }
  if (dir.col !== 0 && dir.row !== 0) {
    return isWalkable(grid, col + dir.col, row) && isWalkable(grid, col, row + dir.row);
  }
  return true;
}

export function findCellPath(
  grid: NavGrid,
  startCol: number,
  startRow: number,
  goalCol: number,
  goalRow: number
): { col: number; row: number }[] {
  const start = nearestWalkable(grid, startCol, startRow);
  const goal = nearestWalkable(grid, goalCol, goalRow);
  if (!start || !goal) {
    return [];
  }
  if (start.col === goal.col && start.row === goal.row) {
    return [start];
  }

  const total = grid.cols * grid.rows;
  const gScore = new Float64Array(total);
  gScore.fill(Number.POSITIVE_INFINITY);
  const cameCol = new Int16Array(total);
  const cameRow = new Int16Array(total);
  cameCol.fill(-1);
  const closed = new Uint8Array(total);
  const open: { index: number; f: number }[] = [];

  const startIndex = cellIndex(grid, start.col, start.row);
  gScore[startIndex] = 0;
  open.push({ index: startIndex, f: octile(start.col, start.row, goal.col, goal.row) });

  const maxPops = total * 2;
  let pops = 0;
  while (open.length > 0 && pops < maxPops) {
    pops += 1;
    let best = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (open[i].f < open[best].f) {
        best = i;
      }
    }
    const current = open.splice(best, 1)[0];
    if (closed[current.index]) {
      continue;
    }
    closed[current.index] = 1;
    const col = current.index % grid.cols;
    const row = Math.floor(current.index / grid.cols);
    if (col === goal.col && row === goal.row) {
      return reconstruct(grid, cameCol, cameRow, goal.col, goal.row);
    }
    for (const dir of DIRS) {
      if (!canStep(grid, col, row, dir)) {
        continue;
      }
      const nextCol = col + dir.col;
      const nextRow = row + dir.row;
      if (!inGrid(grid, nextCol, nextRow)) {
        continue;
      }
      const nextIndex = cellIndex(grid, nextCol, nextRow);
      const tentative = gScore[current.index] + dir.cost;
      if (tentative >= gScore[nextIndex]) {
        continue;
      }
      cameCol[nextIndex] = col;
      cameRow[nextIndex] = row;
      gScore[nextIndex] = tentative;
      open.push({
        index: nextIndex,
        f: tentative + octile(nextCol, nextRow, goal.col, goal.row),
      });
    }
  }
  return [];
}

function reconstruct(
  grid: NavGrid,
  cameCol: Int16Array,
  cameRow: Int16Array,
  col: number,
  row: number
): { col: number; row: number }[] {
  const path: { col: number; row: number }[] = [];
  let currentCol = col;
  let currentRow = row;
  const guard = grid.cols * grid.rows;
  for (let step = 0; step < guard; step += 1) {
    path.push({ col: currentCol, row: currentRow });
    const index = cellIndex(grid, currentCol, currentRow);
    const prevCol = cameCol[index];
    const prevRow = cameRow[index];
    if (prevCol < 0) {
      break;
    }
    currentCol = prevCol;
    currentRow = prevRow;
  }
  path.reverse();
  return path;
}

export function smoothWorldPath(grid: NavGrid, cells: readonly { col: number; row: number }[]): NavPoint[] {
  const points = cells.map((cell) => cellCenter(grid, cell.col, cell.row));
  if (points.length <= 2) {
    return points;
  }
  const smoothed: NavPoint[] = [points[0]];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let next = anchor + 1;
    for (let index = points.length - 1; index > anchor + 1; index -= 1) {
      const from = worldToCell(grid, points[anchor].x, points[anchor].y);
      const to = worldToCell(grid, points[index].x, points[index].y);
      if (cellsHaveSight(grid, from.col, from.row, to.col, to.row)) {
        next = index;
        break;
      }
    }
    smoothed.push(points[next]);
    anchor = next;
  }
  return smoothed;
}

export function findWorldPath(grid: NavGrid, from: NavPoint, to: NavPoint): NavPoint[] {
  const start = worldToCell(grid, from.x, from.y);
  const goal = worldToCell(grid, to.x, to.y);
  const cells = findCellPath(grid, start.col, start.row, goal.col, goal.row);
  return smoothWorldPath(grid, cells);
}
