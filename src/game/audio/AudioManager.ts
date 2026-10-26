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
const LOOP_OVERLAP_SEC = 0.45;

type SettingsListener = (settings: AudioSettings) => void;

class AudioManagerImpl {
  private settings: AudioSettings = loadAudioSettings();
  private unlocked = false;
  private bgm: HTMLAudioElement | null = null;
  private bgmNext: HTMLAudioElement | null = null;
  private loopTimer = 0;
  private currentBgmId: BgmId | null = null;
  private pendingContext: BgmContextId | null = null;
  private fadeGeneration = 0;
  private readonly missing = new Set<string>();
  private readonly listeners = new Set<SettingsListener>();
  private sfxVoices = 0;
  private audioContext: AudioContext | null = null;

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
    void this.ensureAudioContext()?.resume();
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
    this.pendingContext = context;
    this.playBgm(BGM_CONTEXT_TO_ID[context], fadeMs);
  }

  playBgm(id: BgmId, fadeMs = BGM_FADE_MS): void {
    if (!this.canUseAudio()) {
      return;
    }
    if (this.currentBgmId === id && this.bgm && !this.bgm.paused) {
      this.pendingContext = null;
      this.applyBgmVolume();
      return;
    }
    void this.crossfadeTo(id, fadeMs).then((played) => {
      if (!played) {
        return;
      }
      this.unlocked = true;
      if (this.pendingContext && BGM_CONTEXT_TO_ID[this.pendingContext] === id) {
        this.pendingContext = null;
      }
    });
  }

  stopBgm(fadeMs = BGM_FADE_MS): void {
    this.pendingContext = null;
    void this.crossfadeTo(null, fadeMs);
  }

  playSfx(id: SfxId, playbackRate = 1, tone: 'flat' | 'blade' = 'flat'): void {
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
      const minRate = tone === 'blade' ? 0.7 : 0.84;
      const maxRate = tone === 'blade' ? 1.05 : 1.2;
      node.playbackRate = Math.min(maxRate, Math.max(minRate, playbackRate));
      if (tone === 'blade') {
        this.colorBlade(node);
      }
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

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    if (!this.audioContext) {
      this.audioContext = new Ctor();
    }
    return this.audioContext;
  }

  /** Dull the bright click so a sword swing does not match the UI tick. */
  private colorBlade(node: HTMLAudioElement): void {
    const ctx = this.ensureAudioContext();
    if (!ctx || ctx.state !== 'running') {
      return;
    }
    try {
      const source = ctx.createMediaElementSource(node);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 980;
      filter.Q.value = 0.6;
      source.connect(filter);
      filter.connect(ctx.destination);
    } catch {
      // The element still plays on its own output.
    }
  }

  destroy(): void {
    this.fadeGeneration += 1;
    this.clearLoopTimer();
    this.stopElement(this.bgmNext);
    this.bgmNext = null;
    this.stopElement(this.bgm);
    this.bgm = null;
    this.currentBgmId = null;
    this.pendingContext = null;
    this.sfxVoices = 0;
    this.listeners.clear();
  }

  private async crossfadeTo(id: BgmId | null, fadeMs: number): Promise<boolean> {
    const generation = ++this.fadeGeneration;
    const duration = Math.min(800, Math.max(300, fadeMs));
    this.clearLoopTimer();
    const outgoing = [this.bgm, this.bgmNext].filter((element): element is HTMLAudioElement => element != null);
    this.bgmNext = null;
    if (outgoing.length > 0) {
      await Promise.all(outgoing.map((element) => this.fadeElement(element, element.volume, 0, duration / 2, generation)));
      if (generation !== this.fadeGeneration) {
        return false;
      }
      for (const element of outgoing) {
        this.stopElement(element);
      }
      this.bgm = null;
      this.currentBgmId = null;
    }
    if (!id || !this.canUseAudio()) {
      return false;
    }
    if (this.missing.has(id)) {
      this.warnMissing(id);
      return false;
    }
    const asset = getBgmAsset(id);
    try {
      const next = new Audio(asset.src);
      next.loop = false;
      next.volume = 0;
      const onError = () => this.markMissing(id);
      next.addEventListener('error', onError, { once: true });
      this.bgm = next;
      this.currentBgmId = id;
      const playResult = next.play();
      if (playResult && typeof playResult.then === 'function') {
        try {
          await playResult;
        } catch (error) {
          this.stopElement(next);
          if (this.bgm === next) {
            this.bgm = null;
            this.currentBgmId = null;
          }
          const name = error instanceof DOMException ? error.name : '';
          if (name !== 'NotAllowedError' && name !== 'AbortError') {
            this.markMissing(id);
          }
          return false;
        }
      }
      if (generation !== this.fadeGeneration || this.bgm !== next) {
        return false;
      }
      await this.fadeElement(next, 0, effectiveBgmVolume(this.settings), duration / 2, generation);
      if (generation === this.fadeGeneration && this.bgm === next && asset.loop !== false) {
        this.armSeamlessLoop(next, id, generation);
      }
      return this.bgm === next;
    } catch {
      this.markMissing(id);
      return false;
    }
  }

  private armSeamlessLoop(element: HTMLAudioElement, id: BgmId, generation: number): void {
    const start = () => {
      if (generation !== this.fadeGeneration || this.bgm !== element) {
        return;
      }
      const duration = element.duration;
      if (!Number.isFinite(duration) || duration <= LOOP_OVERLAP_SEC + 0.2) {
        element.loop = true;
        return;
      }
      const waitMs = Math.max(0, (duration - element.currentTime - LOOP_OVERLAP_SEC) * 1000);
      this.clearLoopTimer();
      this.loopTimer = window.setTimeout(() => {
        this.loopTimer = 0;
        void this.overlapLoop(element, id, generation);
      }, waitMs);
    };
    if (element.readyState >= 1 && Number.isFinite(element.duration)) {
      start();
      return;
    }
    element.addEventListener('loadedmetadata', start, { once: true });
  }

  private async overlapLoop(current: HTMLAudioElement, id: BgmId, generation: number): Promise<void> {
    if (generation !== this.fadeGeneration || this.bgm !== current || this.missing.has(id)) {
      return;
    }
    const asset = getBgmAsset(id);
    const incoming = new Audio(asset.src);
    incoming.loop = false;
    incoming.volume = 0;
    this.bgmNext = incoming;
    try {
      const playResult = incoming.play();
      if (playResult && typeof playResult.catch === 'function') {
        await playResult.catch(() => {
          this.stopElement(incoming);
          if (this.bgmNext === incoming) {
            this.bgmNext = null;
          }
          current.loop = true;
        });
      }
    } catch {
      current.loop = true;
      return;
    }
    if (generation !== this.fadeGeneration || this.bgm !== current) {
      this.stopElement(incoming);
      return;
    }
    const target = effectiveBgmVolume(this.settings);
    await Promise.all([
      this.fadeElement(current, current.volume, 0, LOOP_OVERLAP_SEC * 1000, generation),
      this.fadeElement(incoming, 0, target, LOOP_OVERLAP_SEC * 1000, generation),
    ]);
    if (generation !== this.fadeGeneration) {
      this.stopElement(incoming);
      return;
    }
    this.stopElement(current);
    this.bgm = incoming;
    this.bgmNext = null;
    incoming.volume = target;
    this.armSeamlessLoop(incoming, id, generation);
  }

  private clearLoopTimer(): void {
    if (this.loopTimer) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = 0;
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
      if (generation !== this.fadeGeneration || (this.bgm !== element && this.bgmNext !== element)) {
        return;
      }
      const t = step / FADE_STEPS;
      element.volume = Math.min(1, Math.max(0, from + (to - from) * t));
      await wait(stepMs);
    }
  }

  private applyBgmVolume(): void {
    const volume = effectiveBgmVolume(this.settings);
    if (this.bgm) {
      this.bgm.volume = volume;
    }
    if (this.bgmNext) {
      this.bgmNext.volume = volume;
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
