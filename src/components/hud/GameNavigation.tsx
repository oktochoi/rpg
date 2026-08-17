import type { CommandDispatcher, MenuId } from '@/game/core/command';
import styles from './hud.module.css';

const NAV_ITEMS: readonly { menu: MenuId; label: string }[] = [
  { menu: 'characters', label: '인물' },
  { menu: 'inventory', label: '가방' },
  { menu: 'map', label: '지도' },
  { menu: 'quest', label: '퀘스트' },
  { menu: 'journal', label: '기록' },
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
          onClick={() => dispatch({ type: 'OPEN_MENU', menu: item.menu })}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
