import { audioManager, SFX_ID } from '@/game/audio';
import { AudioSettings } from '@/components/settings/AudioSettings';
import styles from './TitleScreen.module.css';

interface TitleScreenProps {
  settingsOpen: boolean;
  onNewGame: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}

const BACKGROUND = '/assets/story/01_luen_village_square.png';

const LORE = `왕국의 변방, 루엔.
오랫동안 잠들어 있던 폐허에서
왕실의 문장이 새겨진 마법석이 발견되기 시작했다.`;

export function TitleScreen({
  settingsOpen,
  onNewGame,
  onOpenSettings,
  onCloseSettings,
}: TitleScreenProps) {
  return (
    <div className={styles.screen}>
      <img className={styles.background} src={BACKGROUND} alt="" />
      <div className={styles.overlay} aria-hidden="true" />
      {settingsOpen ? (
        <section className={styles.panel} aria-label="설정">
          <h1 className={styles.title}>설정</h1>
          <div className={styles.settings}>
            <AudioSettings />
          </div>
          <div className={styles.actions}>
            <button className={styles.button} type="button" onClick={onCloseSettings}>
              <span className={styles.buttonLabel}>뒤로</span>
            </button>
          </div>
        </section>
      ) : (
        <section className={styles.panel} aria-label="타이틀">
          <p className={styles.kicker}>이야기</p>
          <h1 className={styles.title}>잿빛 연대기</h1>
          <p className={styles.description}>{LORE}</p>
          <div className={styles.actions}>
            <button
              className={styles.button}
              type="button"
              onClick={() => {
                audioManager.unlock();
                audioManager.playSfx(SFX_ID.UI_CONFIRM);
                onNewGame();
              }}
            >
              <span className={styles.buttonLabel}>새 게임</span>
            </button>
            <button
              className={styles.button}
              type="button"
              onClick={() => {
                audioManager.unlock();
                audioManager.playSfx(SFX_ID.UI_CLICK);
                onOpenSettings();
              }}
            >
              <span className={styles.buttonLabel}>설정</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
