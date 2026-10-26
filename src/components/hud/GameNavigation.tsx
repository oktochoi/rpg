import type { CommandDispatcher, MenuId } from '@/game/core/command';
import { audioManager, SFX_ID } from '@/game/audio';
import { GameIcon, type GameIconName } from '@/components/ui/GameIcon';
import styles from './hud.module.css';

const NAV_ITEMS: readonly { menu: MenuId; label: string; icon: GameIconName }[] = [
  { menu: 'character', label: '캐릭터', icon: 'character' },
  { menu: 'inventory', label: '가방', icon: 'bag' },
  { menu: 'quest', label: '퀘스트', icon: 'quest' },
  { menu: 'settings', label: '설정', icon: 'settings' },
];

interface GameNavigationProps {
  dispatch: CommandDispatcher;
  unspentStatPoints?: number;
}

export function GameNavigation({ dispatch, unspentStatPoints = 0 }: GameNavigationProps) {
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
          <GameIcon name={item.icon} />
          <span>{item.label}</span>
          {item.menu === 'character' && unspentStatPoints > 0 ? <span className={styles.dot} aria-hidden="true" /> : null}
        </button>
      ))}
    </nav>
  );
}
