import * as Phaser from 'phaser';
import { getArenaDefinition } from './arena-definitions';
import { clampCircleOutsideRects, layoutArena, toWorldPoint, toWorldRect } from './arena-geometry';
import type { ArenaLayout, ArenaRuntimeView, ArenaWorldRect } from './arena-types';
import { COMBAT_DEPTH } from '../visual/combat-depth';

const KIND_COLOR: Record<string, number> = {
  wall: 0x2a2620,
  tree: 0x1e4a28,
  rock: 0x5a5348,
  cart: 0x6b5340,
  crate: 0x8a6a3a,
  palisade: 0x6b4a2a,
  tent: 0x7a5a38,
  fire: 0xe07030,
  pillar: 0x6a6570,
  statue: 0x7a7480,
  rubble: 0x4a4548,
  altar: 0x6b5480,
  debris: 0x4e4852,
};

export class CombatArena {
  readonly view: ArenaRuntimeView;
  readonly solidBodies: Phaser.GameObjects.Rectangle[] = [];
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly decorGraphics: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    arenaId: string,
    spawnBias: 'default' | 'observed' = 'default'
  ) {
    const definition = getArenaDefinition(arenaId);
    const layout: ArenaLayout = layoutArena(scene.scale.width, scene.scale.height, definition.logicalWidth, definition.logicalHeight);
    const solids: ArenaWorldRect[] = [
      ...definition.walls.map((rect) => ({ ...toWorldRect(rect, layout), kind: rect.kind, collision: true })),
      ...definition.obstacles.map((rect) => ({ ...toWorldRect(rect, layout), kind: rect.kind, collision: true })),
    ];
    const decorations: ArenaWorldRect[] = definition.decorations.map((rect) => ({
      ...toWorldRect(rect, layout),
      kind: rect.kind,
      collision: false,
    }));
    const spawnNorm =
      spawnBias === 'observed' && definition.observedPlayerSpawn
        ? definition.observedPlayerSpawn
        : definition.playerSpawn;
    const playerSpawn = toWorldPoint(spawnNorm.x, spawnNorm.y, layout);
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

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(COMBAT_DEPTH.ground);
    this.decorGraphics = scene.add.graphics();
    this.decorGraphics.setDepth(COMBAT_DEPTH.shadow);
    this.drawGround(definition.palette.ground, definition.palette.groundAccent, definition.palette.edge);
    this.spawnColliders(solids, definition.palette);
    this.drawDecorations(decorations);

    scene.physics.world.setBounds(layout.x, layout.y, layout.width, layout.height);
    scene.cameras.main.setBounds(layout.x, layout.y, layout.width, layout.height);
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

  clampPoint(x: number, y: number, radius: number): { x: number; y: number } {
    return clampCircleOutsideRects(x, y, radius, this.view.solids, {
      left: this.view.layout.x,
      top: this.view.layout.y,
      right: this.view.layout.x + this.view.layout.width,
      bottom: this.view.layout.y + this.view.layout.height,
    });
  }

  collidesCircle(x: number, y: number, radius: number): boolean {
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

  private drawGround(ground: number, accent: number, edge: number): void {
    const { x, y, width, height } = this.view.layout;
    this.graphics.fillStyle(edge, 1);
    this.graphics.fillRect(x - 10, y - 10, width + 20, height + 20);
    this.graphics.fillStyle(ground, 1);
    this.graphics.fillRect(x, y, width, height);
    this.graphics.fillStyle(accent, 0.28);
    this.graphics.fillRect(x + width * 0.08, y + height * 0.1, width * 0.84, height * 0.8);
  }

  private spawnColliders(solids: readonly ArenaWorldRect[], palette: { wall: number; obstacle: number }): void {
    for (const solid of solids) {
      const color = solid.kind === 'wall' ? palette.wall : KIND_COLOR[solid.kind] ?? palette.obstacle;
      const rect = this.scene.add.rectangle(solid.x + solid.w / 2, solid.y + solid.h / 2, solid.w, solid.h, color, 0.95);
      rect.setDepth(COMBAT_DEPTH.shadow);
      rect.setStrokeStyle(1, 0x0e0c0a, 0.55);
      this.scene.physics.add.existing(rect, true);
      this.solidBodies.push(rect);
    }
  }

  private drawDecorations(decorations: readonly ArenaWorldRect[]): void {
    for (const deco of decorations) {
      const color = KIND_COLOR[deco.kind] ?? 0x5a5048;
      this.decorGraphics.fillStyle(color, deco.kind === 'fire' ? 0.7 : 0.55);
      this.decorGraphics.fillRect(deco.x, deco.y, deco.w, deco.h);
      if (deco.kind === 'fire') {
        this.decorGraphics.fillStyle(0xf0c040, 0.45);
        this.decorGraphics.fillCircle(deco.x + deco.w / 2, deco.y + deco.h / 2, Math.min(deco.w, deco.h) * 0.45);
      }
    }
  }

  private destroy = (): void => {
    this.graphics.destroy();
    this.decorGraphics.destroy();
    for (const body of this.solidBodies) {
      body.destroy();
    }
    this.solidBodies.length = 0;
  };
}

function circleHitsAabb(x: number, y: number, radius: number, rect: ArenaWorldRect): boolean {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - closestX;
  const dy = y - closestY;
  return dx * dx + dy * dy < radius * radius;
}
