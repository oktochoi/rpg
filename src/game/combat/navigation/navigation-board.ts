import { findWorldPath } from './astar';
import {
  cellCenter,
  findLosAnchor,
  isWalkable,
  worldHasSight,
  worldToCell,
  type NavGrid,
  type NavPoint,
} from './navigation-grid';

export const NAV_REPATH_MS = 320;
export const HEAVY_REPATH_MS = 680;
const STUCK_MS = 680;
const STUCK_MOVE_PX = 6;
const WAYPOINT_RADIUS = 18;
const PATHS_PER_FRAME = 2;

export type NavChaseMode = 'DIRECT_CHASE' | 'PATH_CHASE' | 'HOLD';

export interface NavSteerRequest {
  id: string;
  x: number;
  y: number;
  speed: number;
  goalX: number;
  goalY: number;
  now: number;
  repathMs: number;
  hold: boolean;
  /** The straight step hits a solid, so a clear grid line is not enough. */
  forcePath?: boolean;
  /** When set, pick a cell that can see the player instead of walking into them. */
  losRing?: { min: number; preferred: number; max: number; bias: number };
  playerX: number;
  playerY: number;
}

export interface NavSteer {
  vx: number;
  vy: number;
  mode: NavChaseMode;
  los: boolean;
  path: readonly NavPoint[];
  waypoint: NavPoint | null;
  goal: NavPoint;
}

interface AgentMemory {
  path: NavPoint[];
  index: number;
  plannedAt: number;
  goalCol: number;
  goalRow: number;
  lastX: number;
  lastY: number;
  lastNow: number;
  stillMs: number;
  forced: boolean;
}

export class NavigationBoard {
  private readonly agents = new Map<string, AgentMemory>();
  private budget = PATHS_PER_FRAME;
  private _pathComputes = 0;

  constructor(readonly grid: NavGrid) {}

  get pathComputes(): number {
    return this._pathComputes;
  }

  beginFrame(): void {
    this.budget = PATHS_PER_FRAME;
  }

  hasSight(from: NavPoint, to: NavPoint): boolean {
    return worldHasSight(this.grid, from, to);
  }

  steer(request: NavSteerRequest): NavSteer {
    const player = { x: request.playerX, y: request.playerY };
    const self = { x: request.x, y: request.y };
    const seesPlayer = this.hasSight(self, player);
    let goal = { x: request.goalX, y: request.goalY };
    if (request.losRing && !seesPlayer) {
      const anchor = findLosAnchor(
        this.grid,
        self,
        player,
        request.losRing.min,
        request.losRing.preferred,
        request.losRing.max,
        request.losRing.bias
      );
      if (anchor) {
        goal = anchor;
      }
    }

    if (request.hold) {
      return { vx: 0, vy: 0, mode: 'HOLD', los: seesPlayer, path: [], waypoint: null, goal };
    }

    const memory = this.memory(request);
    this.trackStuck(memory, request);
    const losGoal = this.hasSight(self, goal);
    const stuck = memory.stillMs >= STUCK_MS && request.speed > 1;

    if (losGoal && !stuck && !request.forcePath) {
      memory.path = [];
      memory.index = 0;
      memory.stillMs = 0;
      const direct = this.velocityToward(request.x, request.y, goal.x, goal.y, request.speed);
      return { ...direct, mode: 'DIRECT_CHASE', los: seesPlayer, path: [], waypoint: goal, goal };
    }

    if (this.shouldRepath(memory, request, goal, stuck)) {
      if (this.budget > 0) {
        this.budget -= 1;
        this._pathComputes += 1;
        memory.path = findWorldPath(this.grid, self, goal);
        memory.index = memory.path.length > 1 ? 1 : 0;
        memory.plannedAt = request.now;
        const cell = worldToCell(this.grid, goal.x, goal.y);
        memory.goalCol = cell.col;
        memory.goalRow = cell.row;
        memory.stillMs = 0;
        memory.forced = false;
      }
    }

    const waypoint = memory.path[memory.index] ?? null;
    if (!waypoint) {
      const escape = this.escapePoint(request.x, request.y);
      if (escape) {
        const step = this.velocityToward(request.x, request.y, escape.x, escape.y, request.speed);
        return { ...step, mode: 'PATH_CHASE', los: seesPlayer, path: [escape], waypoint: escape, goal };
      }
      const direct = this.velocityToward(request.x, request.y, goal.x, goal.y, request.speed);
      return { ...direct, mode: 'DIRECT_CHASE', los: seesPlayer, path: memory.path, waypoint: goal, goal };
    }

    const dist = Math.hypot(waypoint.x - request.x, waypoint.y - request.y);
    if (dist <= WAYPOINT_RADIUS && memory.index < memory.path.length - 1) {
      memory.index += 1;
    }
    const current = memory.path[memory.index] ?? waypoint;
    const step = this.velocityToward(request.x, request.y, current.x, current.y, request.speed);
    return {
      ...step,
      mode: 'PATH_CHASE',
      los: seesPlayer,
      path: memory.path,
      waypoint: current,
      goal,
    };
  }

  private memory(request: NavSteerRequest): AgentMemory {
    const existing = this.agents.get(request.id);
    if (existing) {
      return existing;
    }
    const created: AgentMemory = {
      path: [],
      index: 0,
      plannedAt: -9999,
      goalCol: -99,
      goalRow: -99,
      lastX: request.x,
      lastY: request.y,
      lastNow: request.now,
      stillMs: 0,
      forced: false,
    };
    this.agents.set(request.id, created);
    return created;
  }

  private trackStuck(memory: AgentMemory, request: NavSteerRequest): void {
    const moved = Math.hypot(request.x - memory.lastX, request.y - memory.lastY);
    const elapsed = Math.max(0, request.now - memory.lastNow);
    if (memory.lastNow > 0 && request.speed > 1 && moved < STUCK_MOVE_PX) {
      memory.stillMs += elapsed;
    } else if (moved >= STUCK_MOVE_PX) {
      memory.stillMs = 0;
    }
    memory.lastX = request.x;
    memory.lastY = request.y;
    memory.lastNow = request.now;
  }

  private shouldRepath(memory: AgentMemory, request: NavSteerRequest, goal: NavPoint, stuck: boolean): boolean {
    if (memory.path.length === 0) {
      return true;
    }
    if (stuck) {
      memory.forced = true;
      return true;
    }
    const cell = worldToCell(this.grid, goal.x, goal.y);
    const shifted = Math.max(Math.abs(cell.col - memory.goalCol), Math.abs(cell.row - memory.goalRow)) >= 1;
    if (shifted) {
      return true;
    }
    if (request.now - memory.plannedAt >= request.repathMs) {
      return true;
    }
    const next = memory.path[memory.index];
    if (next && !this.hasSight({ x: request.x, y: request.y }, next)) {
      return true;
    }
    return false;
  }

  private escapePoint(x: number, y: number): NavPoint | null {
    const here = worldToCell(this.grid, x, y);
    const offsets = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (const [dx, dy] of offsets) {
      const col = here.col + dx;
      const row = here.row + dy;
      if (isWalkable(this.grid, col, row)) {
        return cellCenter(this.grid, col, row);
      }
    }
    return null;
  }

  private velocityToward(x: number, y: number, toX: number, toY: number, speed: number): { vx: number; vy: number } {
    const dx = toX - x;
    const dy = toY - y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 1) {
      return { vx: 0, vy: 0 };
    }
    return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
  }
}
