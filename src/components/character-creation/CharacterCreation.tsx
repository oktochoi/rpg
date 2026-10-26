import { useState } from 'react';
import { PLAYER_CLASSES, PLAYER_CLASS_ID } from '@/game/player/classes';
import { sanitizePlayerName } from '@/game/app-flow';
import { audioManager, SFX_ID } from '@/game/audio';
import styles from './CharacterCreation.module.css';

const HERO_FULLBODY = '/assets/characters/hero_swordsman/hero_fullbody.png';

interface CharacterCreationProps {
  onBack: () => void;
  onConfirm: (name: string) => void;
}

function HeroFigure() {
  return (
    <div className={styles.heroFrame}>
      <img className={styles.hero} src={HERO_FULLBODY} alt="" />
    </div>
  );
}

export function CharacterCreation({ onBack, onConfirm }: CharacterCreationProps) {
  const [name, setName] = useState('');
  const sanitized = sanitizePlayerName(name);
  const canStart = Boolean(sanitized);
  const definition = PLAYER_CLASSES[PLAYER_CLASS_ID.ADVENTURER];

  return (
    <div className={styles.screen}>
      <img className={styles.backdrop} src="/assets/story/03_adventurers_guild_hall.png" alt="" />
      <section className={styles.panel} aria-label="캐릭터 생성">
        <div className={styles.creation}>
          <HeroFigure />
          <div className={styles.creationFields}>
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
              <h3>모험가</h3>
              <p className={styles.style}>모든 여행자는 모험가로 시작한다.</p>
              <p>{definition.description}</p>
            </div>
            <div className={styles.actions}>
              <button className={styles.back} type="button" onClick={onBack}>
                타이틀로
              </button>
              <button
                className={styles.start}
                type="button"
                disabled={!canStart}
                onClick={() => {
                  if (!sanitized) {
                    return;
                  }
                  audioManager.unlock();
                  audioManager.playSfx(SFX_ID.UI_CONFIRM);
                  onConfirm(sanitized);
                }}
              >
                모험 시작
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
