export const BGM_CONTEXT = {
  STORY_SAFE: 'STORY_SAFE',
  STORY_MYSTERY: 'STORY_MYSTERY',
  COMBAT_NORMAL: 'COMBAT_NORMAL',
  COMBAT_BOSS: 'COMBAT_BOSS',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
} as const;

export type BgmContextId = (typeof BGM_CONTEXT)[keyof typeof BGM_CONTEXT];

export const SFX_ID = {
  UI_CLICK: 'ui_click',
  UI_CONFIRM: 'ui_confirm',
  UI_CANCEL: 'ui_cancel',
  UI_ERROR: 'ui_error',
  PLAYER_ATTACK: 'player_attack',
  PLAYER_DASH: 'player_dash',
  PLAYER_HIT: 'player_hit',
  PLAYER_DEATH: 'player_death',
  WARRIOR_CHARGE_SLASH: 'warrior_charge_slash',
  WARRIOR_GUARD: 'warrior_guard',
  MAGE_MAGIC_BOLT: 'mage_magic_bolt',
  MAGE_FIREBALL: 'mage_fireball',
  MAGE_FROST_NOVA: 'mage_frost_nova',
  MAGE_BLINK: 'mage_blink',
  ROGUE_ATTACK: 'rogue_attack',
  ROGUE_SHADOW_DASH: 'rogue_shadow_dash',
  ROGUE_BACKSTAB: 'rogue_backstab',
  GOBLIN_ATTACK: 'goblin_attack',
  ARCHER_SHOT: 'archer_shot',
  BRUTE_ATTACK: 'brute_attack',
  ENEMY_HIT: 'enemy_hit',
  ENEMY_DEATH: 'enemy_death',
  GUARDIAN_SLAM: 'guardian_slam',
  GUARDIAN_PROJECTILE: 'guardian_projectile',
  GUARDIAN_CHARGE: 'guardian_charge',
  GUARDIAN_PHASE2: 'guardian_phase2',
  GUARDIAN_DEATH: 'guardian_death',
  COMBAT_START: 'combat_start',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  QUEST_UPDATE: 'quest_update',
  IMPORTANT_DISCOVERY: 'important_discovery',
} as const;

export type SfxId = (typeof SFX_ID)[keyof typeof SFX_ID];

export type BgmId =
  | 'story_safe'
  | 'story_mystery'
  | 'combat_normal'
  | 'combat_boss'
  | 'victory'
  | 'defeat';

export interface AudioSettings {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  bgmVolume: 0.6,
  sfxVolume: 0.8,
  muted: false,
};

export const AUDIO_STORAGE_KEY = 'audio_settings';

export const BGM_FADE_MS = 450;
