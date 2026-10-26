import { useEffect, type ReactNode } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import styles from './GameModal.module.css';

export type GameModalSize = 'md' | 'lg' | 'xl';

const WIDTH: Record<GameModalSize, string> = {
  md: '520px',
  lg: '680px',
  xl: '960px',
};

interface GameModalProps {
  title: string;
  kicker?: string;
  meta?: string;
  size?: GameModalSize;
  /** Prefer fitting content on one screen; grow up to viewport instead of a short scroll box. */
  fitContent?: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the dialog panel. Defaults to title. */
  ariaLabel?: string;
}

export function GameModal({
  title,
  kicker,
  meta,
  size = 'md',
  fitContent = false,
  onClose,
  children,
  ariaLabel,
}: GameModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        audioManager.playSfx(SFX_ID.UI_CANCEL);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          audioManager.playSfx(SFX_ID.UI_CANCEL);
          onClose();
        }
      }}
    >
      <section
        className={`${styles.panel} ${fitContent ? styles.fitContent : ''}`}
        style={{ ['--modal-width' as string]: WIDTH[size] }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titles}>
            {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
            <h2 className={styles.title}>{title}</h2>
            {meta ? <p className={styles.meta}>{meta}</p> : null}
          </div>
          <button
            className={styles.close}
            type="button"
            onClick={() => {
              audioManager.playSfx(SFX_ID.UI_CANCEL);
              onClose();
            }}
          >
            닫기
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
