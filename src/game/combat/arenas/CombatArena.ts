import * as Phaser from 'phaser';
import { getArenaDefinition } from './arena-definitions';
import { spawnArenaSpriteDecor } from './arena-sprite-decor';
import { clampCircleOutsideRects, layoutArena, toWorldPoint, toWorldRect } from './arena-geometry';
import { clampToWalkable, createWalkableArea, walkableContains, type CombatGroundTheme, type WalkableArea } from './walkable-bounds';
import type { ArenaLayout, ArenaRectNorm, ArenaRuntimeView, ArenaWorldRect } from './arena-types';
import { COMBAT_DEPTH } from '../visual/combat-depth';

export class CombatArena {
  readonly view: ArenaRuntimeView;
  readonly solidBodies: Phaser.GameObjects.Rectangle[] = [];
  private readonly spriteDecor: Phaser.GameObjects.GameObject[] = [];
  private readonly theme: CombatGroundTheme;
  private walkable: WalkableArea;

  constructor(
    private readonly scene: Phaser.Scene,
    arenaId: string,
    spawnBias: 'default' | 'observed' = 'default'
  ) {
    const definition = getArenaDefinition(arenaId);
    this.theme = arenaTheme(definition.id);
    const layout: ArenaLayout = layoutArena(scene.scale.width, scene.scale.height, definition.logicalWidth, definition.logicalHeight);
    const solids: ArenaWorldRect[] = [
      ...definition.walls.map((rect) => ({ ...toWorldRect(rect, layout), kind: rect.kind, collision: true })),
      ...definition.obstacles.map((rect) => ({
        ...toWorldRect(treeFootprint(rect, layout), layout),
        kind: rect.kind,
        collision: true,
      })),
      ...definition.decorations
        .filter((rect) => rect.kind === 'tree')
        .map((rect) => ({
          ...toWorldRect(treeFootprint(rect, layout), layout),
          kind: rect.kind,
          collision: true,
        })),
    ];
    const decorations: ArenaWorldRect[] = definition.decorations.map((rect) => ({
      ...toWorldRect(rect, layout),
      kind: rect.kind,
      collision: false,
    }));
    const visuals: ArenaWorldRect[] = [
      ...definition.obstacles.map((rect) => ({ ...toWorldRect(rect, layout), kind: rect.kind, collision: true })),
      ...decorations,
    ];
    const spawnNorm =
      spawnBias === 'observed' && definition.observedPlayerSpawn
        ? definition.observedPlayerSpawn
        : definition.playerSpawn;
    this.walkable = createWalkableArea(this.theme, scene.scale.width, scene.scale.height);
    const rawSpawn = toWorldPoint(spawnNorm.x, spawnNorm.y, layout);
    const playerSpawn = clampToWalkable(this.walkable, rawSpawn.x, rawSpawn.y, 24);
    const wallPad = Math.min(layout.width, layout.height) * 0.07;
    this.view = {
      id: definition.id,
      layout,
      solids,
      decorations,
      playerSpawn,
      innerBounds: {
        left: layout.x + wallPad,
        top: layout.y + wallPad,
        right: layout.x + layout.width - wallPad,
        bottom: layout.y + layout.height - wallPad,
      },
    };

    this.spriteDecor.push(...spawnArenaSpriteDecor(scene, this.theme, definition.id, visuals));
    this.spawnColliders(solids);

    const floor = this.walkable.aabb;
    scene.physics.world.setBounds(floor.x, floor.y, floor.width, floor.height);
    scene.cameras.main.setBounds(0, 0, scene.scale.width, scene.scale.height);
    scene.cameras.main.setBackgroundColor('#12100e');
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get layout(): ArenaLayout {
    return this.view.layout;
  }

  get solidRects(): ArenaWorldRect[] {
    return [...this.view.solids];
  }

  worldPoint(nx: number, ny: number): { x: number; y: number } {
    return toWorldPoint(nx, ny, this.view.layout);
  }

  get walkableAabb(): { x: number; y: number; width: number; height: number } {
    return this.walkable.aabb;
  }

  containsWalkable(x: number, y: number, radius = 0): boolean {
    return walkableContains(this.walkable, x, y, radius);
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.walkable = createWalkableArea(this.theme, canvasWidth, canvasHeight);
    const floor = this.walkable.aabb;
    this.scene.physics.world.setBounds(floor.x, floor.y, floor.width, floor.height);
  }

  clampPoint(x: number, y: number, radius: number): { x: number; y: number } {
    const onFloor = clampToWalkable(this.walkable, x, y, radius);
    return clampCircleOutsideRects(onFloor.x, onFloor.y, radius, this.view.solids, {
      left: this.walkable.aabb.x,
      top: this.walkable.aabb.y,
      right: this.walkable.aabb.x + this.walkable.aabb.width,
      bottom: this.walkable.aabb.y + this.walkable.aabb.height,
    });
  }

  collidesCircle(x: number, y: number, radius: number): boolean {
    if (!walkableContains(this.walkable, x, y, radius)) {
      return true;
    }
    return this.view.solids.some(
      (solid) =>
        x + radius > solid.x &&
        x - radius < solid.x + solid.w &&
        y + radius > solid.y &&
        y - radius < solid.y + solid.h &&
        circleHitsAabb(x, y, radius, solid)
    );
  }

  wireColliders(actors: Phaser.GameObjects.GameObject[]): void {
    for (const body of this.solidBodies) {
      for (const actor of actors) {
        this.scene.physics.add.collider(actor, body);
      }
    }
  }

  private spawnColliders(solids: readonly ArenaWorldRect[]): void {
    for (const solid of solids) {
      const rect = this.scene.add.rectangle(solid.x + solid.w / 2, solid.y + solid.h / 2, solid.w, solid.h, 0x000000, 0);
      rect.setDepth(COMBAT_DEPTH.shadow);
      this.scene.physics.add.existing(rect, true);
      this.solidBodies.push(rect);
    }
  }

  private destroy = (): void => {
    for (const decor of this.spriteDecor) {
      decor.destroy();
    }
    this.spriteDecor.length = 0;
    for (const body of this.solidBodies) {
      body.destroy();
    }
    this.solidBodies.length = 0;
  };
}

/** Foot collider around the trunk, not the whole canopy. */
function treeFootprint(rect: ArenaRectNorm, layout: ArenaLayout): ArenaRectNorm {
  if (rect.kind !== 'tree') {
    return rect;
  }
  const visualNormW = (rect.h * layout.height * 1.65) / Math.max(1, layout.width);
  const w = Math.max(rect.w * 0.9, Math.min(visualNormW * 0.42, rect.w * 2));
  const h = Math.max(rect.h * 0.4, 0.05);
  return {
    ...rect,
    x: rect.x + rect.w / 2 - w / 2,
    y: rect.y + rect.h - h,
    w,
    h,
  };
}

function arenaTheme(id: string): CombatGroundTheme {
  if (id.includes('guardian')) {
    return 'guardian';
  }
  if (id.includes('camp')) {
    return 'camp';
  }
  if (id.includes('ruins')) {
    return 'ruins';
  }
  if (id.includes('training')) {
    return 'yard';
  }
  return 'forest';
}

function circleHitsAabb(x: number, y: number, radius: number, rect: ArenaWorldRect): boolean {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - closestX;
  const dy = y - closestY;
  return dx * dx + dy * dy < radius * radius;
}
