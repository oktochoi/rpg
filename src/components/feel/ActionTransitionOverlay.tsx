import { useEffect, useState } from 'react';
import type { ActionTransitionSpec } from '../../game/feel/action-transition';
import styles from './ActionTransitionOverlay.module.css';

const RUN_FRAMES = [1, 2, 3, 4, 5, 6, 7, 8].map(
  (frame) => `/assets/characters/hero_swordsman/frames/run_${String(frame).padStart(2, '0')}.png`
);

interface ActionTransitionOverlayProps {
  spec: ActionTransitionSpec;
}

export function ActionTransitionOverlay({ spec }: ActionTransitionOverlayProps) {
  const moving = spec.kind === 'move';
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!moving) {
      return;
    }
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % RUN_FRAMES.length);
    }, 90);
    return () => window.clearInterval(timer);
  }, [moving, spec.durationMs]);

  if (spec.kind === 'none' || spec.durationMs <= 0) {
    return null;
  }

  const showCopy = Boolean(spec.title || spec.detail);

  return (
    <div
      className={styles.overlay}
      data-kind={spec.kind}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.vignette} aria-hidden />
      <div className={styles.stage}>
        {spec.art ? (
          <div className={styles.artFrame}>
            <img className={styles.art} src={spec.art} alt="" />
          </div>
        ) : null}
        {moving ? (
          <img className={styles.runner} src={RUN_FRAMES[frame]} alt="" />
        ) : null}
        {showCopy ? (
          <div className={styles.copy}>
            {spec.title ? <p className={styles.title}>{spec.title}</p> : null}
            {spec.detail ? <p className={styles.detail}>{spec.detail}</p> : null}
          </div>
        ) : null}
        <div className={styles.bar} aria-hidden>
          <div
            className={styles.barFill}
            style={{ animationDuration: `${Math.max(spec.durationMs, 200)}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
