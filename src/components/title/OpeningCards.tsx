import { useEffect, useRef, useState } from 'react';
import { audioManager, BGM_CONTEXT, SFX_ID } from '@/game/audio';
import styles from './OpeningCards.module.css';

const BACKGROUND = '/assets/story/01_luen_village_square.png';

const CARDS = [
  '왕국 북부의 길이 마을 앞에서 끊긴다.\n옷에는 아직 길의 먼지가 남아 있다.',
  '작은 마을 루엔.\n여관 간판과 모험가 길드가 흙길 너머로 보인다.',
  '북문 앞 경비들이 평소보다 오래 서 있다.\n숲에서 고블린이 도로 쪽으로 나온다는 말이 광장에 돈다.',
  '장부에는 아직 이름이 없다.\n광장으로 나간다.',
] as const;

interface OpeningCardsProps {
  onFinish: () => void;
}

export function OpeningCards({ onFinish }: OpeningCardsProps) {
  const [index, setIndex] = useState(0);
  const finished = useRef(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const last = index >= CARDS.length - 1;

  const finish = () => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CONFIRM);
    onFinish();
  };

  const advance = () => {
    if (last) {
      finish();
      return;
    }
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CLICK);
    setIndex((current) => Math.min(CARDS.length - 1, current + 1));
  };

  useEffect(() => {
    audioManager.playBgmContext(BGM_CONTEXT.STORY_SAFE);
  }, []);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    nextRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.target instanceof HTMLButtonElement) {
        return;
      }
      event.preventDefault();
      advanceRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.screen} onClick={advance}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.background} src={BACKGROUND} alt="" />
      <div className={styles.overlay} aria-hidden="true" />
      <section className={styles.copy} aria-label="인트로">
        <p className={styles.kicker}>{`${index + 1} / ${CARDS.length}`}</p>
        <p className={styles.body} aria-live="polite">
          {CARDS[index]}
        </p>
        <div className={styles.actions}>
          <button
            className={styles.skip}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              finish();
            }}
          >
            건너뛰기
          </button>
          <button
            ref={nextRef}
            className={styles.next}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              advance();
            }}
          >
            계속
          </button>
        </div>
      </section>
    </div>
  );
}
