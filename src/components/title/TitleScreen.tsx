import { audioManager, SFX_ID } from '@/game/audio';
import { AudioSettings } from '@/components/settings/AudioSettings';
import styles from './TitleScreen.module.css';

interface TitleScreenProps {
  canContinue: boolean;
  settingsOpen: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}

const LORE = `왕국의 변방, 루엔.
오랫동안 잠들어 있던 폐허에서
왕실의 문장이 새겨진 마법석이 발견되기 시작했다.`;

export function TitleScreen({
  canContinue,
  settingsOpen,
  onNewGame,
  onContinue,
  onOpenSettings,
  onCloseSettings,
}: TitleScreenProps) {
  if (settingsOpen) {
    return (
      <div className={styles.screen}>
        <section className={styles.panel} aria-label="설정">
          <button className={styles.back} type="button" onClick={onCloseSettings}>
            뒤로
          </button>
          <h1 className={styles.title}>설정</h1>
          <div className={styles.settings}>
            <AudioSettings />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <section className={styles.panel} aria-label="타이틀">
        <p className={styles.kicker}>AI RPG</p>
        <h1 className={styles.title}>잿빛 연대기</h1>
        <p className={styles.lore}>{LORE}</p>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => {
              audioManager.unlock();
              audioManager.playSfx(SFX_ID.UI_CONFIRM);
              onNewGame();
            }}
          >
            NEW GAME
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => {
              audioManager.unlock();
              audioManager.playSfx(SFX_ID.UI_CONFIRM);
              onContinue();
            }}
          >
            CONTINUE
          </button>
          <button
            type="button"
            onClick={() => {
              audioManager.unlock();
              audioManager.playSfx(SFX_ID.UI_CLICK);
              onOpenSettings();
            }}
          >
            SETTINGS
          </button>
        </div>
      </section>
    </div>
  );
}
