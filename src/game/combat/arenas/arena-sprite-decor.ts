import type * as Phaser from 'phaser';
import { COMBAT_DEPTH } from '../visual/combat-depth';
import { plateFrame } from './walkable-bounds';
import type { ArenaWorldRect } from './arena-types';

type ArenaTheme = 'forest' | 'camp' | 'ruins' | 'guardian' | 'yard';

const PROP = (n: number) => `/assets/world/props/environment_props_${String(n).padStart(3, '0')}.png`;
const PLATE = (name: string) => `/game-assets/combat/backgrounds/${name}.png`;
const OBSTACLE = (name: string) => `/game-assets/combat/obstacles/${name}.png`;

/** Dedicated combat plates. Story paintings are only the fallback until these files exist. */
const GROUND_ART: Record<ArenaTheme, { plate: string; story: string }> = {
  forest: { plate: PLATE('forest'), story: '/assets/story/04_forest_road.png' },
  camp: { plate: PLATE('camp'), story: '/assets/story/04_forest_road.png' },
  yard: { plate: PLATE('yard'), story: '/assets/story/01_luen_village_square.png' },
  ruins: { plate: PLATE('ruins'), story: '/assets/story/05_ancient_ruins.png' },
  guardian: { plate: PLATE('guardian'), story: '/assets/story/05_ancient_ruins.png' },
};

const RUINS_PILLAR = { path: OBSTACLE('ruins_pillar'), heightScale: 1.7 };
const RUINS_RUBBLE = { path: OBSTACLE('ruins_rubble'), heightScale: 1.05 };
const RUINS_ALTAR = { path: OBSTACLE('ruins_altar'), heightScale: 1.25 };
const CAMP_CRATE = { path: OBSTACLE('camp_crate'), heightScale: 1.05 };
const YARD_CRATE = { path: OBSTACLE('yard_crate'), heightScale: 1.05 };

const OBSTACLE_ART: Record<string, { path: string; fallback?: string; heightScale: number }> = {
  'forest:tree': { path: OBSTACLE('forest_tree'), fallback: PROP(1), heightScale: 1.65 },
  'forest:rock': { path: OBSTACLE('forest_rock'), fallback: PROP(10), heightScale: 1.05 },
  'forest:cart': { path: OBSTACLE('forest_cart'), heightScale: 1.15 },
  'camp:palisade': { path: OBSTACLE('camp_palisade'), heightScale: 1.55 },
  'camp:crate': CAMP_CRATE,
  'camp:rock': CAMP_CRATE,
  'camp:tent': { path: OBSTACLE('camp_tent'), heightScale: 1.35 },
  'camp:fire': { path: OBSTACLE('camp_fire'), heightScale: 1.2 },
  'ruins:pillar': RUINS_PILLAR,
  'ruins:statue': { path: OBSTACLE('ruins_statue'), heightScale: 1.45 },
  'ruins:rubble': RUINS_RUBBLE,
  'ruins:debris': RUINS_RUBBLE,
  'ruins:altar': RUINS_ALTAR,
  'guardian:pillar': RUINS_PILLAR,
  'guardian:rubble': RUINS_RUBBLE,
  'guardian:debris': RUINS_RUBBLE,
  'guardian:altar': RUINS_ALTAR,
  'yard:crate': YARD_CRATE,
  'yard:debris': YARD_CRATE,
};

/** Backdrop tint plus the floor painted under the fighters. */
const STAGE: Record<ArenaTheme, { tint: number; floor: number; floorLit: number }> = {
  forest: { tint: 0xffffff, floor: 0x142016, floorLit: 0x2a4030 },
  camp: { tint: 0xffc090, floor: 0x1c120c, floorLit: 0x4a301c },
  yard: { tint: 0xffffff, floor: 0x221c16, floorLit: 0x463c30 },
  ruins: { tint: 0xd4e2ff, floor: 0x16161c, floorLit: 0x32343f },
  guardian: { tint: 0xc8b0ee, floor: 0x120e16, floorLit: 0x32243f },
};

/**
 * Terrain slices in this pack are individual props (paths, cliffs, grass corners),
 * not seamless floor tiles. Tiling them across the arena reads as a broken mosaic,
 * so the floor stays painted and only obstacles get real sprites.
 */
export function spawnArenaSpriteDecor(
  scene: Phaser.Scene,
  theme: ArenaTheme,
  arenaId: string,
  features: readonly ArenaWorldRect[] = []
): Phaser.GameObjects.GameObject[] {
  if (typeof Image === 'undefined') {
    return [];
  }
  const spawned: Phaser.GameObjects.GameObject[] = [];
  const stage = STAGE[theme];
  const floor = scene.add.graphics();
  floor.setDepth(COMBAT_DEPTH.ground + 0.12);
  spawned.push(floor);
  const lipKey = 'arena_lip_blank';
  if (!scene.textures.exists(lipKey)) {
    const blank = document.createElement('canvas');
    blank.width = 2;
    blank.height = 2;
    scene.textures.addCanvas(lipKey, blank);
  }
  const lip = scene.add.image(0, 0, lipKey);
  lip.setVisible(false);
  lip.setDepth(COMBAT_DEPTH.ground + 0.14);
  lip.setOrigin(0.5, 0);
  spawned.push(lip);

  const paintFloor = (backdropBottom: number) => {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const seam = Math.min(height - 96, Math.max(height * 0.36, backdropBottom - 8));
    floor.clear();
    floor.fillStyle(stage.floor, 1);
    floor.fillRect(0, seam, width, height - seam);
    floor.fillStyle(stage.floorLit, 0.9);
    floor.fillEllipse(width * 0.5, seam + (height - seam) * 0.58, width * 0.78, (height - seam) * 0.82);
    floor.fillStyle(0x000000, 0.18);
    floor.fillEllipse(width * 0.5, height + 8, width * 1.05, (height - seam) * 0.42);
    const feather = 36;
    for (let band = 0; band < 6; band += 1) {
      const fade = 1 - band / 6;
      floor.fillStyle(stage.floor, 0.42 * fade);
      floor.fillRect(0, seam - feather + (feather * band) / 6, width, feather / 6 + 1);
    }
  };
  const groundArt = GROUND_ART[theme];
  const ground = placeSprite(scene, {
    path: groundArt.plate,
    fallbackPath: groundArt.story,
    x: scene.scale.width / 2,
    y: 0,
    displayH: scene.scale.height,
    depth: COMBAT_DEPTH.ground + 0.05,
    originY: 0,
    tint: stage.tint,
    plate: { width: scene.scale.width, height: scene.scale.height },
    stage: { width: scene.scale.width, height: scene.scale.height },
    onPlate: () => {
      floor.clear();
      lip.setVisible(false);
    },
    onFitted: (bottom) => {
      paintFloor(bottom);
      mountGroundLip(scene, lip, groundArt.story, bottom, stage.tint);
    },
  });
  if (ground) {
    spawned.push(ground);
  }

  features.forEach((feature, index) => {
    const spec = spriteForFeature(feature.kind, theme, arenaId, index);
    if (!spec) {
      return;
    }
    const image = placeSprite(scene, {
      path: spec.path,
      fallbackPath: spec.fallback,
      x: feature.x + feature.w / 2,
      y: feature.y + feature.h,
      displayH: Math.max(42, feature.h * spec.heightScale),
      depth: COMBAT_DEPTH.character + (feature.y + feature.h) * 0.001,
    });
    if (image) {
      spawned.push(image);
    }
  });

  return spawned;
}

function spriteForFeature(
  kind: ArenaWorldRect['kind'],
  theme: ArenaTheme,
  _arenaId: string,
  _index: number
): { path: string; fallback?: string; heightScale: number } | null {
  return OBSTACLE_ART[`${theme}:${kind}`] ?? null;
}

function mountGroundLip(
  scene: Phaser.Scene,
  lip: Phaser.GameObjects.Image,
  path: string,
  backdropBottom: number,
  tint: number
): void {
  const key = `arena_lip_${path}`;
  const place = (source: CanvasImageSource, width: number, height: number) => {
    if (!lip.active || !scene.sys?.isActive()) {
      return;
    }
    if (!scene.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      const sliceH = Math.max(48, Math.round(height * 0.32));
      canvas.width = Math.min(1280, width);
      canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }
      context.drawImage(source, 0, height - sliceH, width, sliceH, 0, 0, canvas.width, canvas.height);
      const shade = context.createLinearGradient(0, 0, 0, canvas.height);
      shade.addColorStop(0, 'rgba(8, 6, 4, 0.05)');
      shade.addColorStop(1, 'rgba(4, 6, 4, 0.5)');
      context.fillStyle = shade;
      context.fillRect(0, 0, canvas.width, canvas.height);
      scene.textures.addCanvas(key, canvas);
    }
    const top = Math.max(0, backdropBottom - 24);
    lip.setTexture(key);
    lip.setDisplaySize(scene.scale.width, Math.max(80, scene.scale.height - top));
    lip.setPosition(scene.scale.width / 2, top);
    if (tint !== 0xffffff) {
      lip.setTint(tint);
    }
    lip.setVisible(true);
  };

  if (scene.textures.exists(`arena_decor_${path}`)) {
    const source = scene.textures.get(`arena_decor_${path}`).getSourceImage() as HTMLImageElement;
    place(source, source.width, source.height);
    return;
  }
}

function placeSprite(
  scene: Phaser.Scene,
  spec: {
    path: string;
    fallbackPath?: string;
    x: number;
    y: number;
    displayH: number;
    depth: number;
    alpha?: number;
    originY?: number;
    tint?: number;
    plate?: { width: number; height: number };
    stage?: { width: number; height: number };
    onPlate?: () => void;
    onFitted?: (bottom: number) => void;
    cover?: { width: number; height: number };
  }
): Phaser.GameObjects.Image | null {
  const image = scene.add.image(spec.x, spec.y, ensureBlankTexture(scene));
  image.setOrigin(0.5, spec.originY ?? 0.92);
  image.setDepth(spec.depth);
  image.setAlpha(spec.alpha ?? 1);
  image.setVisible(false);

  const fit = (key: string, width: number, height: number, mode: 'plate' | 'story' | 'prop') => {
    if (!image.active) {
      return;
    }
    image.setTexture(key);
    image.setCrop();
    image.clearTint();
    if (mode === 'plate' && spec.plate) {
      const frame = plateFrame(spec.plate.width, spec.plate.height);
      image.setOrigin(0.5, 0.5);
      image.setDisplaySize(frame.width, frame.height);
      image.setPosition(frame.left + frame.width / 2, frame.top + frame.height / 2);
      spec.onPlate?.();
    } else if (mode === 'story' && spec.stage) {
      const canvasW = spec.stage.width;
      const canvasH = spec.stage.height;
      let displayW = canvasW;
      let displayH = (height / Math.max(1, width)) * displayW;
      if (displayH > canvasH * 0.78) {
        displayH = canvasH * 0.78;
        displayW = (width / Math.max(1, height)) * displayH;
      }
      image.setOrigin(0.5, 0);
      image.setDisplaySize(displayW, displayH);
      image.setPosition(canvasW / 2, 0);
      if (spec.tint && spec.tint !== 0xffffff) {
        image.setTint(spec.tint);
      }
      spec.onFitted?.(displayH);
    } else {
      const aspect = width / Math.max(1, height);
      image.setOrigin(0.5, spec.originY ?? 0.92);
      image.setDisplaySize(spec.displayH * aspect, spec.displayH);
      image.setPosition(spec.x, spec.y);
    }
    image.setVisible(true);
  };

  const load = (path: string, mode: 'plate' | 'story' | 'prop', fallback?: string) => {
    const key = `arena_decor_${path}`;
    const apply = (width: number, height: number) => fit(key, width, height, mode);
    if (scene.textures.exists(key)) {
      const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
      apply(source.width, source.height);
      return;
    }
    const loader = new Image();
    loader.onload = () => {
      if (!scene.sys?.isActive()) {
        return;
      }
      if (!scene.textures.exists(key)) {
        scene.textures.addImage(key, loader);
      }
      apply(loader.naturalWidth, loader.naturalHeight);
    };
    loader.onerror = () => {
      if (fallback) {
        load(fallback, mode === 'plate' ? 'story' : 'prop');
        return;
      }
      if (image.active && mode !== 'story') {
        image.destroy();
      }
    };
    loader.src = path;
  };

  if (spec.plate) {
    load(spec.path, 'plate', spec.fallbackPath);
  } else {
    load(spec.path, 'prop', spec.fallbackPath);
  }
  return image;
}

function ensureBlankTexture(scene: Phaser.Scene): string {
  const key = 'arena_lip_blank';
  if (!scene.textures.exists(key)) {
    const blank = document.createElement('canvas');
    blank.width = 2;
    blank.height = 2;
    scene.textures.addCanvas(key, blank);
  }
  return key;
}

