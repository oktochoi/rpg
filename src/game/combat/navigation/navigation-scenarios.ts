import { findCellPath, findWorldPath } from './astar';
import { NavigationBoard } from './navigation-board';
import { buildNavGrid, cellsHaveSight, isWalkable, type NavGrid } from './navigation-grid';
import { surroundOffset, type EnemyBehaviorContext } from '../enemies/behaviors/behavior-types';

function pass(lines: string[], name: string, detail: string): void {
  lines.push(`PASS ${name}: ${detail}`);
}

function fail(lines: string[], name: string, detail: string): void {
  lines.push(`FAIL ${name}: ${detail}`);
}

function gridFromRows(rows: string[], cell = 32): NavGrid {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const solids = [];
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (rows[row][col] === '#') {
        solids.push({ x: col * cell, y: row * cell, w: cell, h: cell });
      }
    }
  }
  return buildNavGrid({ x: 0, y: 0, width: width * cell, height: height * cell }, solids, cell);
}

function blockedWaypoint(grid: NavGrid, path: readonly { x: number; y: number }[]): boolean {
  return path.some((point) => {
    const col = Math.floor(point.x / grid.cellSize);
    const row = Math.floor(point.y / grid.cellSize);
    return !isWalkable(grid, col, row);
  });
}

function slotContext(index: number, count: number): EnemyBehaviorContext {
  return {
    x: 0,
    y: 0,
    playerX: 400,
    playerY: 300,
    playerVx: 0,
    playerVy: 0,
    homeX: 0,
    homeY: 0,
    distance: 100,
    isPlayerAlive: true,
    isAttacking: false,
    knockbackActive: false,
    moveSpeed: 200,
    definition: {
      id: 'goblin',
      name: '고블린',
      maxHp: 1,
      moveSpeed: 200,
      damage: 1,
      attackRange: 54,
      attackCooldownMs: 1,
      behaviorType: 'MELEE',
      size: 28,
      color: 0,
      telegraphMs: 1,
      attackDurationMs: 1,
      hitStartMs: 1,
      hitEndMs: 1,
      hitboxWidth: 1,
      hitboxHeight: 1,
      hitboxOffset: 1,
    },
    formationIndex: index,
    aliveCount: count,
    hasMeleeToken: false,
  };
}

export function runNavigationScenarios(): string[] {
  const lines: string[] = [];

  const open = gridFromRows(['......', '......', '......', '......']);
  const openBoard = new NavigationBoard(open);
  openBoard.beginFrame();
  const direct = openBoard.steer({
    id: 'open',
    x: 40,
    y: 40,
    speed: 180,
    goalX: 140,
    goalY: 40,
    now: 0,
    repathMs: 320,
    hold: false,
    playerX: 140,
    playerY: 40,
  });
  if (direct.mode === 'DIRECT_CHASE' && openBoard.pathComputes === 0 && direct.vx > 0) {
    pass(lines, 'case1-direct', direct.mode);
  } else {
    fail(lines, 'case1-direct', `${direct.mode} computes ${openBoard.pathComputes}`);
  }

  const wall = gridFromRows(['......', '..##..', '..##..', '......']);
  const wallBoard = new NavigationBoard(wall);
  wallBoard.beginFrame();
  const around = wallBoard.steer({
    id: 'wall',
    x: 16,
    y: 48,
    speed: 160,
    goalX: 176,
    goalY: 48,
    now: 0,
    repathMs: 320,
    hold: false,
    playerX: 176,
    playerY: 48,
  });
  const wallPath = findWorldPath(wall, { x: 16, y: 48 }, { x: 176, y: 48 });
  if (
    around.mode === 'PATH_CHASE' &&
    wallPath.length >= 2 &&
    !blockedWaypoint(wall, wallPath) &&
    Math.abs(wallPath[wallPath.length - 1].x - 176) < 40
  ) {
    pass(lines, 'case2-wall', `nodes ${wallPath.length}`);
  } else {
    fail(lines, 'case2-wall', `${around.mode} nodes ${wallPath.length}`);
  }

  const corner = gridFromRows(['.......', '...#...', '...#...', '...#...', '.......']);
  const cornerPath = findWorldPath(corner, { x: 16, y: 80 }, { x: 200, y: 80 });
  const goesAround = cornerPath.some((point) => point.y < 48 || point.y > 112);
  if (cornerPath.length >= 2 && goesAround && !blockedWaypoint(corner, cornerPath)) {
    pass(lines, 'case3-corner', `nodes ${cornerPath.length}`);
  } else {
    fail(lines, 'case3-corner', `nodes ${cornerPath.length} around ${goesAround}`);
  }

  const losBoard = new NavigationBoard(wall);
  losBoard.beginFrame();
  const anchor = losBoard.steer({
    id: 'archer',
    x: 16,
    y: 48,
    speed: 120,
    goalX: 176,
    goalY: 48,
    now: 0,
    repathMs: 320,
    hold: false,
    losRing: { min: 64, preferred: 96, max: 140, bias: 0 },
    playerX: 176,
    playerY: 48,
  });
  const anchorSees = anchor.goal.x !== 176 || anchor.goal.y !== 48;
  const sight = cellsHaveSight(
    wall,
    Math.floor(anchor.goal.x / 32),
    Math.floor(anchor.goal.y / 32),
    Math.floor(176 / 32),
    Math.floor(48 / 32)
  );
  if (anchor.mode === 'PATH_CHASE' && anchorSees && sight && !anchor.los) {
    pass(lines, 'case4-archer-los', `goal ${Math.round(anchor.goal.x)},${Math.round(anchor.goal.y)}`);
  } else {
    fail(lines, 'case4-archer-los', JSON.stringify({ mode: anchor.mode, sight, los: anchor.los, goal: anchor.goal }));
  }

  const slots = [0, 1, 2, 3, 4].map((index) => surroundOffset(slotContext(index, 5), 48));
  const unique = new Set(slots.map((slot) => `${Math.round(slot.x)}:${Math.round(slot.y)}`));
  if (unique.size === 5) {
    pass(lines, 'case5-slots', `${unique.size} positions`);
  } else {
    fail(lines, 'case5-slots', `${unique.size}`);
  }

  const moving = new NavigationBoard(wall);
  moving.beginFrame();
  moving.steer({
    id: 'mover',
    x: 16,
    y: 48,
    speed: 160,
    goalX: 176,
    goalY: 48,
    now: 0,
    repathMs: 320,
    hold: false,
    playerX: 176,
    playerY: 48,
  });
  const afterFirst = moving.pathComputes;
  moving.beginFrame();
  moving.steer({
    id: 'mover',
    x: 20,
    y: 48,
    speed: 160,
    goalX: 180,
    goalY: 48,
    now: 100,
    repathMs: 320,
    hold: false,
    playerX: 180,
    playerY: 48,
  });
  const afterSoon = moving.pathComputes;
  moving.beginFrame();
  moving.steer({
    id: 'mover',
    x: 24,
    y: 48,
    speed: 160,
    goalX: 176,
    goalY: 120,
    now: 500,
    repathMs: 320,
    hold: false,
    playerX: 176,
    playerY: 120,
  });
  if (afterSoon === afterFirst && moving.pathComputes > afterSoon) {
    pass(lines, 'case6-repath', `first ${afterFirst} soon ${afterSoon} later ${moving.pathComputes}`);
  } else {
    fail(lines, 'case6-repath', `first ${afterFirst} soon ${afterSoon} later ${moving.pathComputes}`);
  }

  const blockedCorner = findCellPath(gridFromRows(['#.', '..']), 0, 1, 1, 0);
  const diagonalCut =
    blockedCorner.length === 2 &&
    blockedCorner[0]?.col === 0 &&
    blockedCorner[0]?.row === 1 &&
    blockedCorner[1]?.col === 1 &&
    blockedCorner[1]?.row === 0;
  const usesOpenCorner = blockedCorner.some((cell) => cell.col === 1 && cell.row === 1);
  if (!diagonalCut && usesOpenCorner) {
    pass(lines, 'corner-cut', blockedCorner.map((cell) => `${cell.col}${cell.row}`).join('-'));
  } else {
    fail(lines, 'corner-cut', blockedCorner.map((cell) => `${cell.col},${cell.row}`).join(' ') || 'empty');
  }

  return lines;
}
