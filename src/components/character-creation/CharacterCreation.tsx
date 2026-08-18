import { useState } from 'react';
import { PLAYER_CLASSES, PLAYER_CLASS_ID } from '@/game/player/classes';
import { sanitizePlayerName } from '@/game/app-flow';
import { audioManager, SFX_ID } from '@/game/audio';
import { PlayerVisualPreview } from '@/components/character/PlayerVisualPreview';
import styles from './CharacterCreation.module.css';

interface CharacterCreationProps {
  onBack: () => void;
  onConfirm: (name: string) => void;
}

export function CharacterCreation({ onBack, onConfirm }: CharacterCreationProps) {
  const [name, setName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const sanitized = sanitizePlayerName(name);
  const canStart = Boolean(sanitized);
  const definition = PLAYER_CLASSES[PLAYER_CLASS_ID.ADVENTURER];

  if (confirming && sanitized) {
    return (
      <div className={styles.screen}>
        <section className={styles.panel} aria-label="캐릭터 확인">
          <h1 className={styles.title}>모험을 시작하시겠습니까?</h1>
          <div className={styles.confirm}>
            <p>
              {sanitized} · 모험가
            </p>
            <PlayerVisualPreview jobId={PLAYER_CLASS_ID.ADVENTURER} size="lg" alt="모험가" />
            <p>{definition.description}</p>
          </div>
          <div className={styles.header}>
            <button className={styles.back} type="button" onClick={() => setConfirming(false)}>
              뒤로
            </button>
            <button
              className={styles.start}
              type="button"
              onClick={() => {
                audioManager.unlock();
                audioManager.playSfx(SFX_ID.UI_CONFIRM);
                onConfirm(sanitized);
              }}
            >
              모험 시작
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <section className={styles.panel} aria-label="캐릭터 생성">
        <div className={styles.header}>
          <button className={styles.back} type="button" onClick={onBack}>
            타이틀로
          </button>
          <button className={styles.start} type="button" disabled={!canStart} onClick={() => setConfirming(true)}>
            확인
          </button>
        </div>
        <h1 className={styles.title}>캐릭터 생성</h1>
        <label className={styles.field}>
          이름
          <input
            maxLength={16}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="1~16자"
          />
        </label>
        <div className={styles.previewCard}>
          <div className={styles.preview} aria-hidden="true">
            <PlayerVisualPreview jobId={PLAYER_CLASS_ID.ADVENTURER} size="lg" alt="모험가" />
          </div>
          <h3>모험가</h3>
          <p className={styles.style}>모든 여행자는 모험가로 시작한다.</p>
          <p>{definition.description}</p>
        </div>
      </section>
    </div>
  );
}
