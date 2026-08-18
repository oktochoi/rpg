export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export function layoutArena(
  canvasWidth: number,
  canvasHeight: number,
  logicalWidth: number,
  logicalHeight: number,
  padding = 28
): { x: number; y: number; width: number; height: number; scale: number } {
  const scale = Math.min(
    Math.max(0.35, (canvasWidth - padding * 2) / logicalWidth),
    Math.max(0.35, (canvasHeight - padding * 2) / logicalHeight)
  );
  const width = logicalWidth * scale;
  const height = logicalHeight * scale;
  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
    scale,
  };
}

export function toWorldPoint(
  nx: number,
  ny: number,
  layout: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  return {
    x: layout.x + nx * layout.width,
    y: layout.y + ny * layout.height,
  };
}

export function toWorldRect(
  rect: Rect,
  layout: { x: number; y: number; width: number; height: number }
): Rect {
  return {
    x: layout.x + rect.x * layout.width,
    y: layout.y + rect.y * layout.height,
    w: rect.w * layout.width,
    h: rect.h * layout.height,
  };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleHitsRect(circle: Circle, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

export function unionArea(rects: readonly Rect[]): number {
  return rects.reduce((sum, rect) => sum + Math.max(0, rect.w) * Math.max(0, rect.h), 0);
}

export function walkableRatio(arenaWidth: number, arenaHeight: number, solids: readonly Rect[]): number {
  const total = Math.max(1, arenaWidth * arenaHeight);
  const blocked = Math.min(total, unionArea(solids));
  return 1 - blocked / total;
}

export function clampCircleOutsideRects(
  x: number,
  y: number,
  radius: number,
  solids: readonly Rect[],
  bounds: { left: number; top: number; right: number; bottom: number }
): { x: number; y: number } {
  let nextX = Math.max(bounds.left + radius, Math.min(bounds.right - radius, x));
  let nextY = Math.max(bounds.top + radius, Math.min(bounds.bottom - radius, y));
  for (let pass = 0; pass < 4; pass += 1) {
    let moved = false;
    for (const solid of solids) {
      if (!circleHitsRect({ x: nextX, y: nextY, radius }, solid)) {
        continue;
      }
      const closestX = Math.max(solid.x, Math.min(nextX, solid.x + solid.w));
      const closestY = Math.max(solid.y, Math.min(nextY, solid.y + solid.h));
      let dx = nextX - closestX;
      let dy = nextY - closestY;
      if (dx === 0 && dy === 0) {
        dx = nextX - (solid.x + solid.w / 2);
        dy = nextY - (solid.y + solid.h / 2);
      }
      const dist = Math.hypot(dx, dy) || 1;
      const push = radius + 1;
      nextX = closestX + (dx / dist) * push;
      nextY = closestY + (dy / dist) * push;
      moved = true;
    }
    nextX = Math.max(bounds.left + radius, Math.min(bounds.right - radius, nextX));
    nextY = Math.max(bounds.top + radius, Math.min(bounds.bottom - radius, nextY));
    if (!moved) {
      break;
    }
  }
  return { x: nextX, y: nextY };
}

export function predictAim(
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  velocityX: number,
  velocityY: number,
  factor: number
): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(0.45, factor));
  const aimX = targetX + velocityX * clamped;
  const aimY = targetY + velocityY * clamped;
  const dx = aimX - originX;
  const dy = aimY - originY;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.001) {
    return { x: 1, y: 0 };
  }
  return { x: dx / dist, y: dy / dist };
}

export function dashStoppedByWall(
  startX: number,
  startY: number,
  dirX: number,
  dirY: number,
  distance: number,
  radius: number,
  solids: readonly Rect[]
): boolean {
  const steps = 8;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const x = startX + dirX * distance * t;
    const y = startY + dirY * distance * t;
    if (solids.some((solid) => circleHitsRect({ x, y, radius }, solid))) {
      return true;
    }
  }
  return false;
}
