import type { EffectAssetDefinition, GameAssetDefinition, SpriteAnimationDefinition, VisualAnimState } from './asset-types';
import { ANIMATION_FRAME_RATE } from './animation-keys';
import { resolvePlayerVisualId } from './resolve-player-visual';

function frames(state: VisualAnimState, start: number, end: number, repeat = -1, frameRate?: number): SpriteAnimationDefinition {
  return {
    startFrame: start,
    endFrame: end,
    frameRate: frameRate ?? ANIMATION_FRAME_RATE[state],
    repeat,
  };
}

/** RPG Smooth Core pack: 8×5 sheet, 256px cells (idle/run/attack/hurt/death). */
const SMOOTH_CORE_FRAME = 256;

function smoothCoreSheet(folder: string, fileStem: string): Partial<GameAssetDefinition> {
  const base = `/assets/${folder}`;
  return {
    path: `${base}/${fileStem}_spritesheet_8x5_256.png`,
    sourceKind: 'spritesheet',
    frameWidth: SMOOTH_CORE_FRAME,
    frameHeight: SMOOTH_CORE_FRAME,
    portraitPath: `${base}/frames/idle_01.png`,
    animations: {
      idle: frames('idle', 0, 7, -1, 5),
      // Run cycle is already dynamic — keep fps low so it doesn't feel frantic.
      walk: frames('walk', 8, 15, -1, 6),
      attack_windup: frames('attack_windup', 16, 19, 0, 10),
      attack: frames('attack', 16, 23, 0, 10),
      dash: frames('dash', 8, 15, -1, 8),
      skill1: frames('skill1', 16, 23, 0, 10),
      skill2: frames('skill2', 16, 23, 0, 10),
      hit: frames('hit', 24, 31, 0, 10),
      death: frames('death', 32, 39, 0, 7),
    },
  };
}

function playerCombatFrames(folder: string, prefix: string): Partial<GameAssetDefinition> {
  const base = `/game-assets/characters/${folder}`;
  return {
    sequenceFrameRate: { walk: 6 },
    framePaths: {
      walk: [`${base}/${prefix}_walk_1.png`, `${base}/${prefix}_walk_2.png`],
    },
    stateTextures: {
      idle: `${base}/${prefix}_idle.png`,
      walk: `${base}/${prefix}_walk_1.png`,
      attack_windup: `${base}/${prefix}_attack_windup.png`,
      attack: `${base}/${prefix}_attack.png`,
      dash: `${base}/${prefix}_dash.png`,
      hit: `${base}/${prefix}_hit.png`,
      death: `${base}/${prefix}_death.png`,
    },
  };
}

function character(
  id: string,
  type: GameAssetDefinition['type'],
  folder: string,
  file: string,
  fallbackKey: string,
  visualSize: number,
  extras: Partial<GameAssetDefinition> = {}
): GameAssetDefinition {
  return {
    id,
    type,
    textureKey: `${type}_${id}`,
    path: extras.path ?? `/game-assets/${folder}/${file}`,
    fallbackKey,
    scale: extras.scale ?? 1,
    originX: extras.originX ?? 0.5,
    originY: extras.originY ?? 0.72,
    visualSize,
    sourceKind: extras.sourceKind ?? 'image',
    visualOffsetX: extras.visualOffsetX ?? 0,
    visualOffsetY: extras.visualOffsetY ?? 0,
    artFacesLeft: extras.artFacesLeft,
    hpBarOffsetY: extras.hpBarOffsetY ?? visualSize * 0.35,
    damageTextOffsetY: extras.damageTextOffsetY ?? visualSize * 0.55,
    animations: extras.animations,
    frameWidth: extras.frameWidth,
    frameHeight: extras.frameHeight,
    stateTextures: extras.stateTextures,
    framePaths: extras.framePaths,
    sequenceFrameRate: extras.sequenceFrameRate,
    portraitPath: extras.portraitPath,
    skillEffectPath: extras.skillEffectPath,
  };
}

const PLAYER_VISUAL_SIZE = 112;
const GUARDIAN_SHEET = '/assets/bosses/ruins_guardian/sheet';

function guardianFrames(name: string, indexes: readonly number[]): string[] {
  return indexes.map((index) => `${GUARDIAN_SHEET}/${name}_${String(index).padStart(2, '0')}.png`);
}

export const GAME_ASSETS = {
  PLAYER: {
    // Only hero pack available — used for pre-class adventurer + swordsman.
    adventurer: character('adventurer', 'player', 'characters/adventurer', 'adventurer_idle.png', 'placeholder_adventurer', PLAYER_VISUAL_SIZE, {
      scale: 1,
      originX: 0.5,
      originY: 0.92,
      // Smooth pack hero faces right at rest.
      artFacesLeft: false,
      hpBarOffsetY: 58,
      damageTextOffsetY: 62,
      ...smoothCoreSheet('characters/hero_swordsman', 'hero_swordsman'),
    }),
    swordsman: character('swordsman', 'player', 'characters/swordsman', 'swordsman_idle.png', 'placeholder_warrior', PLAYER_VISUAL_SIZE, {
      scale: 1,
      originX: 0.5,
      originY: 0.92,
      artFacesLeft: false,
      hpBarOffsetY: 58,
      damageTextOffsetY: 62,
      skillEffectPath: '/game-assets/characters/swordsman/swordsman_skill_effects.png',
      ...smoothCoreSheet('characters/hero_swordsman', 'hero_swordsman'),
    }),
    mage: character('mage', 'player', 'characters/mage', 'mage_idle.png', 'placeholder_mage', PLAYER_VISUAL_SIZE, {
      scale: 1,
      originX: 0.5,
      originY: 0.88,
      portraitPath: '/game-assets/characters/mage/mage_portrait.png',
      skillEffectPath: '/game-assets/characters/mage/mage_skill_effects.png',
      ...playerCombatFrames('mage', 'mage'),
    }),
    rogue: character('rogue', 'player', 'characters/rogue', 'rogue_idle.png', 'placeholder_rogue', 102, {
      scale: 0.95,
      originX: 0.5,
      originY: 0.88,
      portraitPath: '/game-assets/characters/rogue/rogue_portrait.png',
      skillEffectPath: '/game-assets/characters/rogue/rogue_skill_effects.png',
      ...playerCombatFrames('rogue', 'rogue'),
    }),
  },
  ENEMY: {
    training_dummy: character(
      'training_dummy',
      'enemy',
      'characters/training_dummy',
      'training_dummy.png',
      'placeholder_goblin',
      120,
      {
        scale: 1,
        originX: 0.5,
        originY: 0.95,
        hpBarOffsetY: 118,
        damageTextOffsetY: 110,
        path: '/assets/characters/training_dummy/training_dummy.png',
      }
    ),
    goblin: character('goblin', 'enemy', 'enemies/goblin', 'goblin_idle.png', 'placeholder_goblin', 88, {
      scale: 1,
      originX: 0.5,
      originY: 0.9,
      hpBarOffsetY: 48,
      damageTextOffsetY: 52,
      ...smoothCoreSheet('sprites/goblin_warrior', 'goblin_warrior'),
    }),
    archer: character('archer', 'enemy', 'enemies/goblin-archer', 'goblin_archer_idle.png', 'placeholder_archer', 92, {
      scale: 1,
      originX: 0.5,
      originY: 0.9,
      hpBarOffsetY: 50,
      damageTextOffsetY: 54,
      ...smoothCoreSheet('sprites/goblin_archer', 'goblin_archer'),
    }),
    goblin_mage: character('goblin_mage', 'enemy', 'enemies/goblin-mage', 'goblin_mage_idle.png', 'placeholder_goblin_mage', 96, {
      scale: 1,
      originX: 0.5,
      originY: 0.9,
      hpBarOffsetY: 52,
      damageTextOffsetY: 56,
      ...smoothCoreSheet('sprites/goblin_mage', 'goblin_mage'),
    }),
    brute: character('brute', 'enemy', 'enemies/stone-golem', 'stone_golem_idle.png', 'placeholder_brute', 148, {
      scale: 1,
      originX: 0.5,
      originY: 0.92,
      hpBarOffsetY: 84,
      damageTextOffsetY: 76,
      ...smoothCoreSheet('sprites/stone_golem', 'stone_golem'),
    }),
    dire_wolf: character('dire_wolf', 'enemy', 'enemies/dire-wolf', 'dire_wolf_idle.png', 'placeholder_dire_wolf', 110, {
      scale: 1,
      originX: 0.5,
      originY: 0.9,
      hpBarOffsetY: 58,
      damageTextOffsetY: 62,
      ...smoothCoreSheet('sprites/dire_wolf', 'dire_wolf'),
    }),
  },
  BOSS: {
    ruins_guardian: character(
      'ruins_guardian',
      'boss',
      'bosses/ruins_guardian',
      'ruins_guardian_idle.png',
      'placeholder_ruins_guardian',
      232,
      {
        scale: 1,
        originX: 0.5,
        originY: 0.92,
        // Sheet walk and slam face left at rest.
        artFacesLeft: true,
        hpBarOffsetY: 128,
        damageTextOffsetY: 118,
        path: `${GUARDIAN_SHEET}/idle_01.png`,
        sequenceFrameRate: {
          idle: 5,
          walk: 8,
          attack_windup: 7,
          slam: 9,
          burst: 8,
          hit: 12,
          death: 6,
          phase_transition: 7,
        },
        framePaths: {
          idle: guardianFrames('idle', [1, 2, 3, 4, 5, 6, 7, 8, 9]),
          walk: guardianFrames('walk', [1, 2, 3, 4, 5, 6, 7, 8, 9]),
          attack_windup: guardianFrames('slam', [1, 2]),
          slam: guardianFrames('slam', [6, 8, 9]),
          burst: guardianFrames('cast', [1, 2, 3, 4]),
          hit: guardianFrames('hit', [1, 2, 5]),
          death: guardianFrames('death', [1, 2, 3, 4]),
          phase_transition: guardianFrames('phase', [1, 2, 3, 4, 5, 6]),
        },
        stateTextures: {
          idle: `${GUARDIAN_SHEET}/idle_01.png`,
          walk: `${GUARDIAN_SHEET}/walk_01.png`,
          attack_windup: `${GUARDIAN_SHEET}/slam_01.png`,
          slam: `${GUARDIAN_SHEET}/slam_06.png`,
          burst: `${GUARDIAN_SHEET}/cast_01.png`,
          hit: `${GUARDIAN_SHEET}/hit_01.png`,
          death: `${GUARDIAN_SHEET}/death_01.png`,
        },
      }
    ),
  },
  NPC: {
    seria: character('seria', 'npc', 'npcs/seria', 'seria_neutral.png', 'placeholder_npc_seria', 96, { originY: 0.5 }),
    leon: character('leon', 'npc', 'npcs/leon', 'leon_neutral.png', 'placeholder_npc_leon', 96, { originY: 0.5 }),
    marta: character('innkeeper', 'npc', 'npcs/marta', 'marta_neutral.png', 'placeholder_npc_marta', 96, { originY: 0.5 }),
  },
  SKILL: {
    warrior_charge_slash: { id: 'warrior_charge_slash', icon: 'slash' },
    warrior_guard: { id: 'warrior_guard', icon: 'shield' },
    mage_fireball: { id: 'mage_fireball', icon: 'fire' },
    mage_frost_nova: { id: 'mage_frost_nova', icon: 'frost' },
    rogue_shadow_dash: { id: 'rogue_shadow_dash', icon: 'dash' },
    rogue_backstab: { id: 'rogue_backstab', icon: 'dagger' },
  },
  PROJECTILE: {
    MAGIC_BOLT: character('magic_bolt', 'projectile', 'effects', 'magic_bolt.png', 'placeholder_bolt', 48, {
      originY: 0.5,
      path: '/assets/vfx/projectiles/frames/shadow_bolt_01.png',
    }),
    FIREBALL: character('fireball', 'projectile', 'effects', 'fireball.png', 'placeholder_fire', 56, {
      originY: 0.5,
      path: '/assets/vfx/projectiles/frames/fireball_01.png',
    }),
    ENEMY_ARROW: character('enemy_arrow', 'projectile', 'effects', 'enemy_arrow.png', 'placeholder_arrow', 140, {
      originY: 0.5,
      path: '/assets/vfx/projectiles/frames/arrow_01.png',
    }),
    BOSS_ARCANE_BOLT: character('boss_arcane_bolt', 'projectile', 'effects', 'boss_arcane_bolt.png', 'placeholder_arcane', 52, {
      originY: 0.5,
      path: '/assets/RPG_Boss_Page1_Page2_Sliced/page1_guardian/guardian_projectile_04.png',
    }),
  },
  EFFECT: {
    slash_basic: effectFromPack('slash_basic', '/assets/vfx/projectiles/frames/slash_hit_01.png'),
    slash_charge: effect('slash_charge', 'slash_charge.png'),
    guard_shield: effect('guard_shield', 'guard_shield.png'),
    frost_nova: effect('frost_nova', 'frost_nova.png'),
    shadow_dash: effect('shadow_dash', 'shadow_dash.png'),
    backstab: effect('backstab', 'backstab.png'),
    hit_spark: effectFromPack('hit_spark', '/assets/vfx/projectiles/frames/slash_hit_04.png'),
    boss_slam: effect('boss_slam', 'boss_slam.png'),
    boss_charge: effect('boss_charge', 'boss_charge.png'),
    boss_phase: effect('boss_phase', 'boss_phase.png'),
  } satisfies Record<string, EffectAssetDefinition>,
  STORY_BACKGROUND: {
    luen_village: { id: 'luen_village', path: '/assets/story/01_luen_village_square.png', theme: 'village' },
    blue_moon_inn: { id: 'blue_moon_inn', path: '/assets/story/02_blue_moon_inn_interior.png', theme: 'inn' },
    luen_adventurers_guild: {
      id: 'luen_adventurers_guild',
      path: '/assets/story/03_adventurers_guild_hall.png',
      theme: 'guild',
    },
    luen_general_store: { id: 'luen_general_store', path: '/assets/story/general_store_interior.png', theme: 'inn' },
    luen_training_ground: { id: 'luen_training_ground', path: '/assets/story/training_ground.png', theme: 'village' },
    forest_road: { id: 'forest_road', path: '/assets/story/04_forest_road.png', theme: 'forest' },
    ancient_ruins: { id: 'ancient_ruins', path: '/assets/story/05_ancient_ruins.png', theme: 'ruins' },
    northern_gate: { id: 'northern_gate', path: '/game-assets/backgrounds/northern-gate/northern_gate.png', theme: 'gate' },
  },
} as const;

function effect(id: string, file: string): EffectAssetDefinition {
  return {
    id,
    textureKey: `effect_${id}`,
    path: `/game-assets/effects/${file}`,
    fallbackKey: 'graphics',
  };
}

function effectFromPack(id: string, path: string): EffectAssetDefinition {
  return {
    id,
    textureKey: `effect_${id}`,
    path,
    fallbackKey: 'graphics',
  };
}

export const PLACEHOLDER_STYLES = [
  { key: 'placeholder_adventurer', size: 64, fill: 0xb8a078, accent: 0x3d6ea6, kind: 'adventurer' as const },
  { key: 'placeholder_warrior', size: 64, fill: 0x3d6ea6, accent: 0xc4d4ee, kind: 'warrior' as const },
  { key: 'placeholder_mage', size: 64, fill: 0x6b4c9a, accent: 0xd4b8f0, kind: 'mage' as const },
  { key: 'placeholder_rogue', size: 64, fill: 0x3d8a5a, accent: 0xb8e0c4, kind: 'rogue' as const },
  { key: 'placeholder_goblin', size: 48, fill: 0xa84a38, accent: 0xe08a6a, kind: 'goblin' as const },
  { key: 'placeholder_archer', size: 48, fill: 0xc47a28, accent: 0xf0c070, kind: 'archer' as const },
  { key: 'placeholder_goblin_mage', size: 48, fill: 0x7a4ab8, accent: 0xd4b8f0, kind: 'mage' as const },
  { key: 'placeholder_brute', size: 80, fill: 0x3a3238, accent: 0x8a7078, kind: 'brute' as const },
  { key: 'placeholder_dire_wolf', size: 56, fill: 0x5a4a48, accent: 0xa89888, kind: 'goblin' as const },
  { key: 'placeholder_ruins_guardian', size: 96, fill: 0x4a3870, accent: 0xe0b060, kind: 'boss' as const },
  { key: 'placeholder_bolt', size: 24, fill: 0x7ec8ff, accent: 0xe8f6ff, kind: 'bolt' as const },
  { key: 'placeholder_fire', size: 28, fill: 0xff7a3d, accent: 0xffd080, kind: 'fire' as const },
  { key: 'placeholder_arrow', size: 24, fill: 0xe0c090, accent: 0x8a6030, kind: 'arrow' as const },
  { key: 'placeholder_arcane', size: 28, fill: 0xb45c9a, accent: 0xf0d080, kind: 'arcane' as const },
];

export function resolvePlayerVisual(jobId: string, rankId?: string): GameAssetDefinition {
  const visualId = resolvePlayerVisualId(jobId, rankId);
  return GAME_ASSETS.PLAYER[visualId];
}

export function getPlayerAsset(classId: string, rankId?: string): GameAssetDefinition {
  return resolvePlayerVisual(classId, rankId);
}

export function getEnemyAsset(typeId: string): GameAssetDefinition {
  if (typeId === 'training_dummy') {
    return GAME_ASSETS.ENEMY.training_dummy;
  }
  if (typeId === 'archer' || typeId === 'goblin_archer') {
    return GAME_ASSETS.ENEMY.archer;
  }
  if (typeId === 'goblin_mage' || typeId === 'mage') {
    return GAME_ASSETS.ENEMY.goblin_mage;
  }
  if (typeId === 'brute' || typeId === 'stone_golem' || typeId === 'golem') {
    return GAME_ASSETS.ENEMY.brute;
  }
  if (typeId === 'dire_wolf' || typeId === 'wolf') {
    return GAME_ASSETS.ENEMY.dire_wolf;
  }
  return GAME_ASSETS.ENEMY.goblin;
}

export function getBossAsset(_bossId: string): GameAssetDefinition {
  return GAME_ASSETS.BOSS.ruins_guardian;
}

export function getNpcAsset(npcId: string): GameAssetDefinition {
  if (npcId === 'leon') {
    return {
      ...GAME_ASSETS.NPC.leon,
      path: '/assets/story/07_leon_knight_npc.png',
    };
  }
  if (npcId === 'innkeeper' || npcId === 'marta') {
    return {
      ...GAME_ASSETS.NPC.marta,
      path: '/assets/story/08_marta_innkeeper_npc.png',
    };
  }
  if (npcId === 'shopkeeper_elin') {
    return {
      ...GAME_ASSETS.NPC.seria,
      id: 'shopkeeper_elin',
      path: '/assets/story/shopkeeper_elin.png',
      fallbackKey: 'placeholder_npc_elin',
    };
  }
  if (npcId === 'guildmaster_doran' || npcId === 'doran') {
    return {
      ...GAME_ASSETS.NPC.seria,
      id: 'guildmaster_doran',
      path: '/assets/story/guild_master_doran.png',
      fallbackKey: 'placeholder_npc_seria',
    };
  }
  return {
    ...GAME_ASSETS.NPC.seria,
    path: '/assets/story/06_seria_scholar_npc.png',
  };
}

export function getStoryBackground(locationId: string): (typeof GAME_ASSETS.STORY_BACKGROUND)[keyof typeof GAME_ASSETS.STORY_BACKGROUND] {
  const backgrounds = GAME_ASSETS.STORY_BACKGROUND;
  if (locationId in backgrounds) {
    return backgrounds[locationId as keyof typeof backgrounds];
  }
  return backgrounds.luen_village;
}

export function listActorAssets(): GameAssetDefinition[] {
  return [
    ...Object.values(GAME_ASSETS.PLAYER),
    ...Object.values(GAME_ASSETS.ENEMY),
    ...Object.values(GAME_ASSETS.BOSS),
    ...Object.values(GAME_ASSETS.NPC),
    ...Object.values(GAME_ASSETS.PROJECTILE),
  ];
}

export function listCombatSpriteAssets(): GameAssetDefinition[] {
  return [
    ...Object.values(GAME_ASSETS.PLAYER),
    ...Object.values(GAME_ASSETS.ENEMY),
    ...Object.values(GAME_ASSETS.BOSS),
    ...Object.values(GAME_ASSETS.PROJECTILE),
  ];
}

export function listEffectAssets(): EffectAssetDefinition[] {
  return Object.values(GAME_ASSETS.EFFECT);
}

export function getProjectileAsset(kind: keyof typeof GAME_ASSETS.PROJECTILE): GameAssetDefinition {
  return GAME_ASSETS.PROJECTILE[kind];
}

export function getEffectAsset(id: keyof typeof GAME_ASSETS.EFFECT): EffectAssetDefinition {
  return GAME_ASSETS.EFFECT[id];
}

export function getSkillIconId(skillId: string): string {
  return GAME_ASSETS.SKILL[skillId as keyof typeof GAME_ASSETS.SKILL]?.icon ?? 'slash';
}
