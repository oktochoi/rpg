import { useEffect, useState } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import styles from './TutorialOverlay.module.css';

const STORAGE_KEY = 'rpg.tutorial.ch1.v5';

/** Survives combat unmounts. A new-game token must clear the seen flag only once. */
let clearedResetToken = '';
let dismissedThisSession = false;

const STEPS = [
  {
    title: '전투 조작',
    body: '이동  WASD\n공격  좌클릭\n회피  Space\n스킬  Q',
  },
] as const;

interface TutorialOverlayProps {
  active: boolean;
  /** Bumps when a brand-new game starts so the tutorial shows again. */
  resetToken?: string;
}

export function TutorialOverlay({ active, resetToken = '' }: TutorialOverlayProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      return;
    }
    try {
      if (resetToken.startsWith('new:') && resetToken !== clearedResetToken) {
        clearedResetToken = resetToken;
        dismissedThisSession = false;
        window.localStorage.removeItem(STORAGE_KEY);
      }
      if (dismissedThisSession || window.localStorage.getItem(STORAGE_KEY) === '1') {
        setOpen(false);
        return;
      }
    } catch {
      if (dismissedThisSession) {
        setOpen(false);
        return;
      }
      // ignore storage errors — still show tutorial once this session
    }
    setOpen(true);
    setStep(0);
  }, [active, resetToken]);

  if (!open || !active) {
    return null;
  }

  const current = STEPS[step] ?? STEPS[0];
  const last = step >= STEPS.length - 1;

  const finish = () => {
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CONFIRM);
    dismissedThisSession = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const next = () => {
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CONFIRM);
    if (last) {
      finish();
      return;
    }
    setStep((value) => value + 1);
  };

  return (
    <div className={styles.overlay} role="note" aria-label="조작 안내">
      <section className={styles.card}>
        <p className={styles.kicker}>조작</p>
        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.body}>{current.body}</p>
        <div className={`${styles.actions} ${last ? styles.actionsSingle : ''}`}>
          {!last ? (
            <button className={styles.button} type="button" onClick={finish}>
              건너뛰기
            </button>
          ) : null}
          <button className={`${styles.button} ${styles.primary}`} type="button" onClick={next}>
            {last ? '알겠다' : '다음'}
          </button>
        </div>
      </section>
    </div>
  );
}
