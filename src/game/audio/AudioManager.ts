import { BGM_CONTEXT_TO_ID, getBgmAsset, getSfxAsset } from './audio-registry';
import {
  effectiveBgmVolume,
  effectiveSfxVolume,
  loadAudioSettings,
  normalizeAudioSettings,
  saveAudioSettings,
} from './audio-settings';
import { BGM_FADE_MS, type AudioSettings, type BgmContextId, type BgmId, type SfxId } from './audio-types';

const MAX_SFX_VOICES = 8;
const FADE_STEPS = 8;

type SettingsListener = (settings: AudioSettings) => void;

class AudioManagerImpl {
  private settings: AudioSettings = loadAudioSettings();
  private unlocked = false;
  private bgm: HTMLAudioElement | null = null;
  private currentBgmId: BgmId | null = null;
  private pendingContext: BgmContextId | null = null;
  private fadeGeneration = 0;
  private readonly missing = new Set<string>();
  private readonly listeners = new Set<SettingsListener>();
  private sfxVoices = 0;

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => {
      this.listeners.delete(listener);
    };
  }

  unlock(): void {
    if (this.unlocked) {
      return;
    }
    this.unlocked = true;
    if (this.pendingContext) {
      const next = this.pendingContext;
      this.pendingContext = null;
      this.playBgmContext(next);
    }
  }

  setSettings(partial: Partial<AudioSettings>): void {
    this.settings = normalizeAudioSettings({ ...this.settings, ...partial });
    saveAudioSettings(this.settings);
    this.applyBgmVolume();
    for (const listener of this.listeners) {
      listener(this.getSettings());
    }
  }

  playBgmContext(context: BgmContextId, fadeMs = BGM_FADE_MS): void {
    if (!this.unlocked) {
      this.pendingContext = context;
      return;
    }
    this.playBgm(BGM_CONTEXT_TO_ID[context], fadeMs);
  }

  playBgm(id: BgmId, fadeMs = BGM_FADE_MS): void {
    if (!this.unlocked) {
      return;
    }
    if (this.currentBgmId === id && this.bgm && !this.bgm.paused) {
      this.applyBgmVolume();
      return;
    }
    void this.crossfadeTo(id, fadeMs);
  }

  stopBgm(fadeMs = BGM_FADE_MS): void {
    this.pendingContext = null;
    void this.crossfadeTo(null, fadeMs);
  }

  playSfx(id: SfxId): void {
    if (!this.canUseAudio() || this.missing.has(id) || this.sfxVoices >= MAX_SFX_VOICES) {
      return;
    }
    this.unlock();
    const asset = getSfxAsset(id);
    if (!asset) {
      this.warnMissing(id);
      return;
    }
    try {
      const node = new Audio(asset.src);
      node.volume = effectiveSfxVolume(this.settings);
      this.sfxVoices += 1;
      const release = () => {
        this.sfxVoices = Math.max(0, this.sfxVoices - 1);
        node.removeEventListener('ended', release);
        node.removeEventListener('error', onError);
      };
      const onError = () => {
        this.markMissing(id);
        release();
      };
      node.addEventListener('ended', release);
      node.addEventListener('error', onError);
      const playResult = node.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {
          this.markMissing(id);
          release();
        });
      }
    } catch {
      this.markMissing(id);
    }
  }

  destroy(): void {
    this.fadeGeneration += 1;
    this.stopElement(this.bgm);
    this.bgm = null;
    this.currentBgmId = null;
    this.pendingContext = null;
    this.sfxVoices = 0;
    this.listeners.clear();
  }

  private async crossfadeTo(id: BgmId | null, fadeMs: number): Promise<void> {
    const generation = ++this.fadeGeneration;
    const duration = Math.min(800, Math.max(300, fadeMs));
    if (this.bgm) {
      await this.fadeElement(this.bgm, this.bgm.volume, 0, duration / 2, generation);
      if (generation !== this.fadeGeneration) {
        return;
      }
      this.stopElement(this.bgm);
      this.bgm = null;
      this.currentBgmId = null;
    }
    if (!id || !this.canUseAudio()) {
      return;
    }
    if (this.missing.has(id)) {
      this.warnMissing(id);
      return;
    }
    const asset = getBgmAsset(id);
    try {
      const next = new Audio(asset.src);
      next.loop = asset.loop !== false;
      next.volume = 0;
      const onError = () => this.markMissing(id);
      next.addEventListener('error', onError, { once: true });
      this.bgm = next;
      this.currentBgmId = id;
      const playResult = next.play();
      if (playResult && typeof playResult.catch === 'function') {
        await playResult.catch(() => {
          this.markMissing(id);
          this.stopElement(next);
          if (this.bgm === next) {
            this.bgm = null;
            this.currentBgmId = null;
          }
        });
      }
      if (generation !== this.fadeGeneration || this.bgm !== next) {
        return;
      }
      await this.fadeElement(next, 0, effectiveBgmVolume(this.settings), duration / 2, generation);
    } catch {
      this.markMissing(id);
    }
  }

  private async fadeElement(
    element: HTMLAudioElement,
    from: number,
    to: number,
    durationMs: number,
    generation: number
  ): Promise<void> {
    const stepMs = durationMs / FADE_STEPS;
    for (let step = 1; step <= FADE_STEPS; step += 1) {
      if (generation !== this.fadeGeneration || this.bgm !== element) {
        return;
      }
      const t = step / FADE_STEPS;
      element.volume = Math.min(1, Math.max(0, from + (to - from) * t));
      await wait(stepMs);
    }
  }

  private applyBgmVolume(): void {
    if (this.bgm) {
      this.bgm.volume = effectiveBgmVolume(this.settings);
    }
  }

  private stopElement(element: HTMLAudioElement | null): void {
    if (!element) {
      return;
    }
    try {
      element.pause();
      element.removeAttribute('src');
      element.load();
    } catch {
      // Missing / autoplay failures must not crash.
    }
  }

  private canUseAudio(): boolean {
    return typeof Audio !== 'undefined';
  }

  private markMissing(id: string): void {
    if (this.missing.has(id)) {
      return;
    }
    this.missing.add(id);
    this.warnMissing(id);
  }

  private warnMissing(id: string): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    console.warn(`[Audio missing: ${id}]`);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const audioManager = new AudioManagerImpl();
