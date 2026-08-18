import { BGM_CONTEXT, SFX_ID, type BgmContextId, type BgmId, type SfxId } from './audio-types';

export interface AudioAssetDefinition {
  id: string;
  src: string;
  loop?: boolean;
}

const AUDIO_ROOT = '/game-assets/audio';

export const BGM_ASSETS: Readonly<Record<BgmId, AudioAssetDefinition>> = {
  story_safe: { id: 'story_safe', src: `${AUDIO_ROOT}/bgm/story_safe.mp3`, loop: true },
  story_mystery: { id: 'story_mystery', src: `${AUDIO_ROOT}/bgm/story_mystery.mp3`, loop: true },
  combat_normal: { id: 'combat_normal', src: `${AUDIO_ROOT}/bgm/combat_normal.mp3`, loop: true },
  combat_boss: { id: 'combat_boss', src: `${AUDIO_ROOT}/bgm/combat_boss.mp3`, loop: true },
  victory: { id: 'victory', src: `${AUDIO_ROOT}/bgm/victory.mp3`, loop: false },
  defeat: { id: 'defeat', src: `${AUDIO_ROOT}/bgm/defeat.mp3`, loop: false },
};

export const SFX_ASSETS: Readonly<Record<SfxId, AudioAssetDefinition>> = {
  [SFX_ID.UI_CLICK]: { id: SFX_ID.UI_CLICK, src: `${AUDIO_ROOT}/sfx/ui_click.mp3` },
  [SFX_ID.UI_CONFIRM]: { id: SFX_ID.UI_CONFIRM, src: `${AUDIO_ROOT}/sfx/ui_confirm.mp3` },
  [SFX_ID.UI_CANCEL]: { id: SFX_ID.UI_CANCEL, src: `${AUDIO_ROOT}/sfx/ui_cancel.mp3` },
  [SFX_ID.UI_ERROR]: { id: SFX_ID.UI_ERROR, src: `${AUDIO_ROOT}/sfx/ui_error.mp3` },
  [SFX_ID.PLAYER_ATTACK]: { id: SFX_ID.PLAYER_ATTACK, src: `${AUDIO_ROOT}/sfx/player_attack.mp3` },
  [SFX_ID.PLAYER_DASH]: { id: SFX_ID.PLAYER_DASH, src: `${AUDIO_ROOT}/sfx/player_dash.mp3` },
  [SFX_ID.PLAYER_HIT]: { id: SFX_ID.PLAYER_HIT, src: `${AUDIO_ROOT}/sfx/player_hit.mp3` },
  [SFX_ID.PLAYER_DEATH]: { id: SFX_ID.PLAYER_DEATH, src: `${AUDIO_ROOT}/sfx/player_death.mp3` },
  [SFX_ID.WARRIOR_CHARGE_SLASH]: { id: SFX_ID.WARRIOR_CHARGE_SLASH, src: `${AUDIO_ROOT}/sfx/warrior_charge_slash.mp3` },
  [SFX_ID.WARRIOR_GUARD]: { id: SFX_ID.WARRIOR_GUARD, src: `${AUDIO_ROOT}/sfx/warrior_guard.mp3` },
  [SFX_ID.MAGE_MAGIC_BOLT]: { id: SFX_ID.MAGE_MAGIC_BOLT, src: `${AUDIO_ROOT}/sfx/mage_magic_bolt.mp3` },
  [SFX_ID.MAGE_FIREBALL]: { id: SFX_ID.MAGE_FIREBALL, src: `${AUDIO_ROOT}/sfx/mage_fireball.mp3` },
  [SFX_ID.MAGE_FROST_NOVA]: { id: SFX_ID.MAGE_FROST_NOVA, src: `${AUDIO_ROOT}/sfx/mage_frost_nova.mp3` },
  [SFX_ID.MAGE_BLINK]: { id: SFX_ID.MAGE_BLINK, src: `${AUDIO_ROOT}/sfx/mage_blink.mp3` },
  [SFX_ID.ROGUE_ATTACK]: { id: SFX_ID.ROGUE_ATTACK, src: `${AUDIO_ROOT}/sfx/rogue_attack.mp3` },
  [SFX_ID.ROGUE_SHADOW_DASH]: { id: SFX_ID.ROGUE_SHADOW_DASH, src: `${AUDIO_ROOT}/sfx/rogue_shadow_dash.mp3` },
  [SFX_ID.ROGUE_BACKSTAB]: { id: SFX_ID.ROGUE_BACKSTAB, src: `${AUDIO_ROOT}/sfx/rogue_backstab.mp3` },
  [SFX_ID.GOBLIN_ATTACK]: { id: SFX_ID.GOBLIN_ATTACK, src: `${AUDIO_ROOT}/sfx/goblin_attack.mp3` },
  [SFX_ID.ARCHER_SHOT]: { id: SFX_ID.ARCHER_SHOT, src: `${AUDIO_ROOT}/sfx/archer_shot.mp3` },
  [SFX_ID.BRUTE_ATTACK]: { id: SFX_ID.BRUTE_ATTACK, src: `${AUDIO_ROOT}/sfx/brute_attack.mp3` },
  [SFX_ID.ENEMY_HIT]: { id: SFX_ID.ENEMY_HIT, src: `${AUDIO_ROOT}/sfx/enemy_hit.mp3` },
  [SFX_ID.ENEMY_DEATH]: { id: SFX_ID.ENEMY_DEATH, src: `${AUDIO_ROOT}/sfx/enemy_death.mp3` },
  [SFX_ID.GUARDIAN_SLAM]: { id: SFX_ID.GUARDIAN_SLAM, src: `${AUDIO_ROOT}/sfx/guardian_slam.mp3` },
  [SFX_ID.GUARDIAN_PROJECTILE]: { id: SFX_ID.GUARDIAN_PROJECTILE, src: `${AUDIO_ROOT}/sfx/guardian_projectile.mp3` },
  [SFX_ID.GUARDIAN_CHARGE]: { id: SFX_ID.GUARDIAN_CHARGE, src: `${AUDIO_ROOT}/sfx/guardian_charge.mp3` },
  [SFX_ID.GUARDIAN_PHASE2]: { id: SFX_ID.GUARDIAN_PHASE2, src: `${AUDIO_ROOT}/sfx/guardian_phase2.mp3` },
  [SFX_ID.GUARDIAN_DEATH]: { id: SFX_ID.GUARDIAN_DEATH, src: `${AUDIO_ROOT}/sfx/guardian_death.mp3` },
  [SFX_ID.COMBAT_START]: { id: SFX_ID.COMBAT_START, src: `${AUDIO_ROOT}/sfx/combat_start.mp3` },
  [SFX_ID.VICTORY]: { id: SFX_ID.VICTORY, src: `${AUDIO_ROOT}/sfx/victory.mp3` },
  [SFX_ID.DEFEAT]: { id: SFX_ID.DEFEAT, src: `${AUDIO_ROOT}/sfx/defeat.mp3` },
  [SFX_ID.QUEST_UPDATE]: { id: SFX_ID.QUEST_UPDATE, src: `${AUDIO_ROOT}/sfx/quest_update.mp3` },
  [SFX_ID.IMPORTANT_DISCOVERY]: { id: SFX_ID.IMPORTANT_DISCOVERY, src: `${AUDIO_ROOT}/sfx/important_discovery.mp3` },
};

export const BGM_CONTEXT_TO_ID: Readonly<Record<BgmContextId, BgmId>> = {
  [BGM_CONTEXT.STORY_SAFE]: 'story_safe',
  [BGM_CONTEXT.STORY_MYSTERY]: 'story_mystery',
  [BGM_CONTEXT.COMBAT_NORMAL]: 'combat_normal',
  [BGM_CONTEXT.COMBAT_BOSS]: 'combat_boss',
  [BGM_CONTEXT.VICTORY]: 'victory',
  [BGM_CONTEXT.DEFEAT]: 'defeat',
};

export function getBgmAsset(id: BgmId): AudioAssetDefinition {
  return BGM_ASSETS[id];
}

export function getSfxAsset(id: SfxId): AudioAssetDefinition | null {
  return SFX_ASSETS[id] ?? null;
}

export function listAudioAssets(): readonly AudioAssetDefinition[] {
  return [...Object.values(BGM_ASSETS), ...Object.values(SFX_ASSETS)];
}
