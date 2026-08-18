import { AUDIO_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS, type AudioSettings } from './audio-types';

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function normalizeAudioSettings(input: Partial<AudioSettings> | null | undefined): AudioSettings {
  return {
    masterVolume: clampVolume(input?.masterVolume ?? DEFAULT_AUDIO_SETTINGS.masterVolume),
    bgmVolume: clampVolume(input?.bgmVolume ?? DEFAULT_AUDIO_SETTINGS.bgmVolume),
    sfxVolume: clampVolume(input?.sfxVolume ?? DEFAULT_AUDIO_SETTINGS.sfxVolume),
    muted: Boolean(input?.muted),
  };
}

export function loadAudioSettings(): AudioSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_AUDIO_SETTINGS };
    }
    return normalizeAudioSettings(JSON.parse(raw) as Partial<AudioSettings>);
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(normalizeAudioSettings(settings)));
  } catch {
    // Ignore quota / private-mode failures. Game must keep running.
  }
}

export function effectiveBgmVolume(settings: AudioSettings): number {
  if (settings.muted) {
    return 0;
  }
  return clampVolume(settings.masterVolume * settings.bgmVolume);
}

export function effectiveSfxVolume(settings: AudioSettings): number {
  if (settings.muted) {
    return 0;
  }
  return clampVolume(settings.masterVolume * settings.sfxVolume);
}
