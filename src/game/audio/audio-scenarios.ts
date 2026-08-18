import { BGM_ASSETS, SFX_ASSETS, listAudioAssets } from './audio-registry';
import { bgmContextForCombat, bgmContextForCombatResult, bgmContextForLocation } from './audio-context';
import { sfxForDash, sfxForEnemyAttack, sfxForPlayerAttack, sfxForSkill } from './combat-audio';
import { BGM_CONTEXT, DEFAULT_AUDIO_SETTINGS, SFX_ID } from './audio-types';
import { clampVolume, normalizeAudioSettings } from './audio-settings';
import { audioManager } from './AudioManager';
import { LOCATION_ID } from '../world/locations/location-definitions';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { encounterTitle } from '../combat/encounters/encounter-presentation';
import { PLAYER_CLASSES } from '../player/classes';

export async function runStep30AudioScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const clamped = normalizeAudioSettings({ masterVolume: 4, bgmVolume: -2, sfxVolume: 0.5, muted: true });
  if (
    clamped.masterVolume === 1 &&
    clamped.bgmVolume === 0 &&
    clamped.sfxVolume === 0.5 &&
    clamped.muted &&
    clampVolume(DEFAULT_AUDIO_SETTINGS.masterVolume) === 0.8
  ) {
    pass('settings-clamp', `master ${clamped.masterVolume} muted ${clamped.muted}`);
  } else {
    fail('settings-clamp', JSON.stringify(clamped));
  }

  const village = bgmContextForLocation(LOCATION_ID.LUEN_VILLAGE);
  const inn = bgmContextForLocation(LOCATION_ID.BLUE_MOON_INN);
  const forest = bgmContextForLocation(LOCATION_ID.FOREST_ROAD);
  const ruins = bgmContextForLocation(LOCATION_ID.ANCIENT_RUINS);
  if (village === BGM_CONTEXT.STORY_SAFE && inn === BGM_CONTEXT.STORY_SAFE && forest === BGM_CONTEXT.STORY_MYSTERY && ruins === BGM_CONTEXT.STORY_MYSTERY) {
    pass('location-bgm', `${village}/${forest}/${ruins}`);
  } else {
    fail('location-bgm', JSON.stringify({ village, inn, forest, ruins }));
  }

  if (
    bgmContextForCombat(ENCOUNTER_ID.RUINS_MIXED_01) === BGM_CONTEXT.COMBAT_NORMAL &&
    bgmContextForCombat(ENCOUNTER_ID.RUINS_BOSS_01) === BGM_CONTEXT.COMBAT_BOSS &&
    bgmContextForCombatResult('VICTORY') === BGM_CONTEXT.VICTORY &&
    bgmContextForCombatResult('DEFEAT') === BGM_CONTEXT.DEFEAT
  ) {
    pass('combat-bgm', 'normal/boss/victory/defeat');
  } else {
    fail('combat-bgm', 'mapping mismatch');
  }

  const assets = listAudioAssets();
  const allPublic = assets.every((asset) => asset.src.startsWith('/game-assets/audio/'));
  if (allPublic && BGM_ASSETS.story_safe && SFX_ASSETS[SFX_ID.PLAYER_ATTACK] && assets.length >= 30) {
    pass('registry', `${assets.length} entries`);
  } else {
    fail('registry', JSON.stringify({ count: assets.length, allPublic }));
  }

  try {
    audioManager.playSfx(SFX_ID.UI_CLICK);
    audioManager.playBgmContext(BGM_CONTEXT.STORY_SAFE);
    audioManager.stopBgm(300);
    pass('missing-fallback', 'playSfx/playBgm no throw');
  } catch (error) {
    fail('missing-fallback', error instanceof Error ? error.message : String(error));
  }

  if (
    sfxForPlayerAttack('warrior') === SFX_ID.PLAYER_ATTACK &&
    sfxForPlayerAttack('mage') === SFX_ID.MAGE_MAGIC_BOLT &&
    sfxForDash('blink') === SFX_ID.MAGE_BLINK &&
    sfxForSkill('mage_fireball') === SFX_ID.MAGE_FIREBALL &&
    sfxForEnemyAttack('brute') === SFX_ID.BRUTE_ATTACK
  ) {
    pass('sfx-map', 'class/skill/enemy');
  } else {
    fail('sfx-map', 'mapping mismatch');
  }

  if (
    encounterTitle(ENCOUNTER_ID.RUINS_MIXED_01).includes('고블린') &&
    encounterTitle(ENCOUNTER_ID.RUINS_BOSS_01) === '고대 수호자' &&
    PLAYER_CLASSES.warrior.playStyle.includes('근접') &&
    PLAYER_CLASSES.mage.baseStats.maxHp < PLAYER_CLASSES.warrior.baseStats.maxHp
  ) {
    pass('presentation', `${encounterTitle(ENCOUNTER_ID.RUINS_BOSS_01)} / ${PLAYER_CLASSES.warrior.name}`);
  } else {
    fail('presentation', encounterTitle(ENCOUNTER_ID.RUINS_BOSS_01));
  }

  return lines;
}
