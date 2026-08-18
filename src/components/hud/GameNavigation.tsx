import type { CommandDispatcher, MenuId } from '@/game/core/command';
import { audioManager, SFX_ID } from '@/game/audio';
import styles from './hud.module.css';

const NAV_ITEMS: readonly { menu: MenuId; label: string }[] = [
  { menu: 'character', label: '캐릭터' },
  { menu: 'characters', label: '인물' },
  { menu: 'inventory', label: '가방' },
  { menu: 'map', label: '지도' },
  { menu: 'quest', label: '퀘스트' },
  { menu: 'journal', label: '기록' },
  { menu: 'save', label: '저장' },
  { menu: 'settings', label: '설정' },
];

interface GameNavigationProps {
  dispatch: CommandDispatcher;
}

export function GameNavigation({ dispatch }: GameNavigationProps) {
  return (
    <nav className={styles.nav} aria-label="게임 메뉴">
      {NAV_ITEMS.map((item) => (
        <button
          className={styles.navButton}
          key={item.menu}
          type="button"
          onClick={() => {
            audioManager.unlock();
            audioManager.playSfx(SFX_ID.UI_CLICK);
            dispatch({ type: 'OPEN_MENU', menu: item.menu });
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
