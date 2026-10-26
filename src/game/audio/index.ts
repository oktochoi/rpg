export { audioManager } from './AudioManager';
export { BGM_ASSETS, SFX_ASSETS, listAudioAssets } from './audio-registry';
export { bgmContextForCombat, bgmContextForCombatResult, bgmContextForLocation } from './audio-context';
export { playPlayerSwing, playerSwingVoice, sfxForDash, sfxForEnemyAttack, sfxForPlayerAttack, sfxForSkill, swingPlaybackRate } from './combat-audio';
export {
  AUDIO_STORAGE_KEY,
  BGM_CONTEXT,
  BGM_FADE_MS,
  DEFAULT_AUDIO_SETTINGS,
  SFX_ID,
  type AudioSettings,
  type BgmContextId,
  type SfxId,
} from './audio-types';
export { clampVolume, loadAudioSettings, normalizeAudioSettings } from './audio-settings';
