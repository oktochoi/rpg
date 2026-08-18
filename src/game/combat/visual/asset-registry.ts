import type { EffectAssetDefinition, GameAssetDefinition, SpriteAnimationDefinition, VisualAnimState } from './asset-types';
import { ANIMATION_FRAME_RATE } from './animation-keys';
import { resolvePlayerVisualId } from './resolve-player-visual';

function frames(state: VisualAnimState, start: number, end: number, repeat = -1): SpriteAnimationDefinition {
  return {
    startFrame: start,
    endFrame: end,
    frameRate: ANIMATION_FRAME_RATE[state],
    repeat,
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

const PLAYER_ANIMS: GameAssetDefinition['animations'] = {
  idle: frames('idle', 0, 3, -1),
  walk: frames('walk', 4, 7, -1),
  attack: frames('attack', 8, 11, 0),
  dash: frames('dash', 12, 14, 0),
  skill1: frames('skill1', 15, 18, 0),
  skill2: frames('skill2', 19, 22, 0),
  hit: frames('hit', 23, 24, 0),
  death: frames('death', 25, 28, 0),
};

const ENEMY_ANIMS: GameAssetDefinition['animations'] = {
  idle: frames('idle', 0, 3, -1),
  walk: frames('walk', 4, 7, -1),
  attack: frames('attack', 8, 11, 0),
  hit: frames('hit', 12, 13, 0),
  death: frames('death', 14, 17, 0),
};

const BOSS_ANIMS: GameAssetDefinition['animations'] = {
  idle: frames('idle', 0, 3, -1),
  slam: frames('slam', 4, 7, 0),
  burst: frames('burst', 8, 11, 0),
  charge: frames('charge', 12, 15, 0),
  hit: frames('hit', 16, 17, 0),
  phase_transition: frames('phase_transition', 18, 21, 0),
  death: frames('death', 22, 25, 0),
};

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
    path: `/game-assets/${folder}/${file}`,
    fallbackKey,
    scale: extras.scale ?? 1,
    originX: extras.originX ?? 0.5,
    originY: extras.originY ?? 0.72,
    visualSize,
    sourceKind: extras.sourceKind ?? 'image',
    visualOffsetX: extras.visualOffsetX ?? 0,
    visualOffsetY: extras.visualOffsetY ?? 0,
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

const PLAYER_VISUAL_SIZE = 108;

export const GAME_ASSETS = {
  PLAYER: {
    adventurer: character('adventurer', 'player', 'characters/adventurer', 'adventurer_idle.png', 'placeholder_adventurer', PLAYER_VISUAL_SIZE, {
      scale: 1,
      originX: 0.5,
      originY: 0.88,
      portraitPath: '/game-assets/characters/adventurer/adventurer_portrait.png',
      ...playerCombatFrames('adventurer', 'adventurer'),
    }),
    swordsman: character('swordsman', 'player', 'characters/swordsman', 'swordsman_idle.png', 'placeholder_warrior', PLAYER_VISUAL_SIZE, {
      scale: 1,
      originX: 0.5,
      originY: 0.88,
      portraitPath: '/game-assets/characters/swordsman/swordsman_portrait.png',
      skillEffectPath: '/game-assets/characters/swordsman/swordsman_skill_effects.png',
      ...playerCombatFrames('swordsman', 'swordsman'),
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
    goblin: character('goblin', 'enemy', 'enemies/goblin', 'goblin_idle.png', 'placeholder_goblin', 64, {
      scale: 1,
      originX: 0.5,
      originY: 0.88,
      hpBarOffsetY: 40,
      damageTextOffsetY: 42,
      sequenceFrameRate: { walk: 4 },
      framePaths: {
        walk: [
          '/game-assets/enemies/goblin/goblin_walk_1.png',
          '/game-assets/enemies/goblin/goblin_walk_2.png',
        ],
      },
      stateTextures: {
        idle: '/game-assets/enemies/goblin/goblin_idle.png',
        walk: '/game-assets/enemies/goblin/goblin_walk_1.png',
        attack_windup: '/game-assets/enemies/goblin/goblin_attack_windup.png',
        attack: '/game-assets/enemies/goblin/goblin_attack.png',
        dash: '/game-assets/enemies/goblin/goblin_dash.png',
        hit: '/game-assets/enemies/goblin/goblin_hit.png',
        death: '/game-assets/enemies/goblin/goblin_death.png',
      },
    }),
    archer: character('archer', 'enemy', 'enemies/goblin-archer', 'goblin_archer_idle.png', 'placeholder_archer', 72, {
      scale: 1,
      originX: 0.5,
      originY: 0.88,
      hpBarOffsetY: 44,
      damageTextOffsetY: 46,
      sequenceFrameRate: { walk: 4 },
      framePaths: {
        walk: [
          '/game-assets/enemies/goblin-archer/goblin_archer_walk_1.png',
          '/game-assets/enemies/goblin-archer/goblin_archer_walk_2.png',
        ],
      },
      stateTextures: {
        idle: '/game-assets/enemies/goblin-archer/goblin_archer_idle.png',
        walk: '/game-assets/enemies/goblin-archer/goblin_archer_walk_1.png',
        attack_windup: '/game-assets/enemies/goblin-archer/goblin_archer_attack_windup.png',
        attack: '/game-assets/enemies/goblin-archer/goblin_archer_attack_shot.png',
        dash: '/game-assets/enemies/goblin-archer/goblin_archer_dash.png',
        hit: '/game-assets/enemies/goblin-archer/goblin_archer_hit.png',
        death: '/game-assets/enemies/goblin-archer/goblin_archer_death.png',
      },
    }),
    brute: character('brute', 'enemy', 'enemies/brute', 'brute_idle.png', 'placeholder_brute', 148, {
      scale: 1,
      originX: 0.5,
      originY: 0.9,
      hpBarOffsetY: 84,
      damageTextOffsetY: 76,
      sequenceFrameRate: { walk: 3.2 },
      framePaths: {
        walk: [
          '/game-assets/enemies/brute/brute_walk_1.png',
          '/game-assets/enemies/brute/brute_walk_2.png',
        ],
      },
      stateTextures: {
        idle: '/game-assets/enemies/brute/brute_idle.png',
        walk: '/game-assets/enemies/brute/brute_walk_1.png',
        attack_windup: '/game-assets/enemies/brute/brute_attack_windup.png',
        attack: '/game-assets/enemies/brute/brute_attack_swing.png',
        charge: '/game-assets/enemies/brute/brute_charge.png',
        dash: '/game-assets/enemies/brute/brute_charge.png',
        hit: '/game-assets/enemies/brute/brute_hit.png',
        death: '/game-assets/enemies/brute/brute_death.png',
      },
    }),
  },
  BOSS: {
    ruins_guardian: character(
      'ruins_guardian',
      'boss',
      'bosses/ruins-guardian',
      'ruins_guardian_idle.png',
      'placeholder_ruins_guardian',
      232,
      {
        scale: 1,
        originX: 0.5,
        originY: 0.92,
        hpBarOffsetY: 128,
        damageTextOffsetY: 118,
        sequenceFrameRate: { walk: 2.4 },
        framePaths: {
          walk: [
            '/game-assets/bosses/ruins-guardian/ruins_guardian_walk_1.png',
            '/game-assets/bosses/ruins-guardian/ruins_guardian_walk_2.png',
          ],
        },
        stateTextures: {
          idle: '/game-assets/bosses/ruins-guardian/ruins_guardian_idle.png',
          walk: '/game-assets/bosses/ruins-guardian/ruins_guardian_walk_1.png',
          attack_windup: '/game-assets/bosses/ruins-guardian/ruins_guardian_slam_windup.png',
          slam: '/game-assets/bosses/ruins-guardian/ruins_guardian_slam_attack.png',
          burst: '/game-assets/bosses/ruins-guardian/ruins_guardian_projectile_cast.png',
          hit: '/game-assets/bosses/ruins-guardian/ruins_guardian_hit.png',
          death: '/game-assets/bosses/ruins-guardian/ruins_guardian_death.png',
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
    MAGIC_BOLT: character('magic_bolt', 'projectile', 'effects', 'magic_bolt.png', 'placeholder_bolt', 18, { originY: 0.5 }),
    FIREBALL: character('fireball', 'projectile', 'effects', 'fireball.png', 'placeholder_fire', 22, { originY: 0.5 }),
    ENEMY_ARROW: character('enemy_arrow', 'projectile', 'effects', 'enemy_arrow.png', 'placeholder_arrow', 16, { originY: 0.5 }),
    BOSS_ARCANE_BOLT: character('boss_arcane_bolt', 'projectile', 'effects', 'boss_arcane_bolt.png', 'placeholder_arcane', 20, {
      originY: 0.5,
    }),
  },
  EFFECT: {
    slash_basic: effect('slash_basic', 'slash_basic.png'),
    slash_charge: effect('slash_charge', 'slash_charge.png'),
    guard_shield: effect('guard_shield', 'guard_shield.png'),
    frost_nova: effect('frost_nova', 'frost_nova.png'),
    shadow_dash: effect('shadow_dash', 'shadow_dash.png'),
    backstab: effect('backstab', 'backstab.png'),
    hit_spark: effect('hit_spark', 'hit_spark.png'),
    boss_slam: effect('boss_slam', 'boss_slam.png'),
    boss_charge: effect('boss_charge', 'boss_charge.png'),
    boss_phase: effect('boss_phase', 'boss_phase.png'),
  } satisfies Record<string, EffectAssetDefinition>,
  STORY_BACKGROUND: {
    luen_village: { id: 'luen_village', path: '/assets/story_assets_pack/01_luen_village_square.png', theme: 'village' },
    blue_moon_inn: { id: 'blue_moon_inn', path: '/assets/story_assets_pack/02_blue_moon_inn_interior.png', theme: 'inn' },
    luen_adventurers_guild: {
      id: 'luen_adventurers_guild',
      path: '/assets/story_assets_pack/03_adventurers_guild_hall.png',
      theme: 'guild',
    },
    luen_general_store: { id: 'luen_general_store', path: '/assets/story_assets_pack/01_luen_village_square.png', theme: 'village' },
    forest_road: { id: 'forest_road', path: '/assets/story_assets_pack/04_forest_road.png', theme: 'forest' },
    ancient_ruins: { id: 'ancient_ruins', path: '/assets/story_assets_pack/05_ancient_ruins.png', theme: 'ruins' },
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

export const PLACEHOLDER_STYLES = [
  { key: 'placeholder_adventurer', size: 64, fill: 0xb8a078, accent: 0x3d6ea6, kind: 'adventurer' as const },
  { key: 'placeholder_warrior', size: 64, fill: 0x3d6ea6, accent: 0xc4d4ee, kind: 'warrior' as const },
  { key: 'placeholder_mage', size: 64, fill: 0x6b4c9a, accent: 0xd4b8f0, kind: 'mage' as const },
  { key: 'placeholder_rogue', size: 64, fill: 0x3d8a5a, accent: 0xb8e0c4, kind: 'rogue' as const },
  { key: 'placeholder_goblin', size: 48, fill: 0xa84a38, accent: 0xe08a6a, kind: 'goblin' as const },
  { key: 'placeholder_archer', size: 48, fill: 0xc47a28, accent: 0xf0c070, kind: 'archer' as const },
  { key: 'placeholder_brute', size: 80, fill: 0x3a3238, accent: 0x8a7078, kind: 'brute' as const },
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
  if (typeId === 'archer' || typeId === 'goblin_archer') {
    return GAME_ASSETS.ENEMY.archer;
  }
  if (typeId === 'brute') {
    return GAME_ASSETS.ENEMY.brute;
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
      path: '/assets/story_assets_pack/07_leon_knight_npc.png',
    };
  }
  if (npcId === 'innkeeper' || npcId === 'marta') {
    return {
      ...GAME_ASSETS.NPC.marta,
      path: '/assets/story_assets_pack/08_marta_innkeeper_npc.png',
    };
  }
  if (npcId === 'shopkeeper_elin') {
    return {
      ...GAME_ASSETS.NPC.seria,
      id: 'shopkeeper_elin',
      path: '/assets/story_assets_pack/shopkeeper_elin_placeholder.png',
      fallbackKey: 'placeholder_npc_elin',
    };
  }
  return {
    ...GAME_ASSETS.NPC.seria,
    path: '/assets/story_assets_pack/06_seria_scholar_npc.png',
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
