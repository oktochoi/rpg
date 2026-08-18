import { useEffect, useState } from 'react';
import { audioManager, type AudioSettings } from '@/game/audio';
import { SFX_ID } from '@/game/audio';
import styles from './AudioSettings.module.css';

function toPercent(value: number): number {
  return Math.round(value * 100);
}

function fromPercent(value: string): number {
  return Math.min(1, Math.max(0, Number(value) / 100));
}

export function AudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(audioManager.getSettings());

  useEffect(() => audioManager.subscribe(setSettings), []);

  return (
    <section className={styles.panel} aria-label="소리 설정">
      <h3 className={styles.heading}>소리</h3>
      <label className={styles.row}>
        <span>Master</span>
        <input
          type="range"
          min={0}
          max={100}
          value={toPercent(settings.masterVolume)}
          onChange={(event) => audioManager.setSettings({ masterVolume: fromPercent(event.target.value) })}
        />
        <span className={styles.value}>{toPercent(settings.masterVolume)}</span>
      </label>
      <label className={styles.row}>
        <span>BGM</span>
        <input
          type="range"
          min={0}
          max={100}
          value={toPercent(settings.bgmVolume)}
          onChange={(event) => audioManager.setSettings({ bgmVolume: fromPercent(event.target.value) })}
        />
        <span className={styles.value}>{toPercent(settings.bgmVolume)}</span>
      </label>
      <label className={styles.row}>
        <span>SFX</span>
        <input
          type="range"
          min={0}
          max={100}
          value={toPercent(settings.sfxVolume)}
          onChange={(event) => audioManager.setSettings({ sfxVolume: fromPercent(event.target.value) })}
        />
        <span className={styles.value}>{toPercent(settings.sfxVolume)}</span>
      </label>
      <label className={styles.mute}>
        <input
          type="checkbox"
          checked={settings.muted}
          onChange={(event) => {
            audioManager.setSettings({ muted: event.target.checked });
            if (!event.target.checked) {
              audioManager.playSfx(SFX_ID.UI_CLICK);
            }
          }}
        />
        Mute
      </label>
    </section>
  );
}
