import { CharacterPanel } from '@/components/character/CharacterPanel';
import { GameHeader } from '@/components/hud/GameHeader';
import { GameNavigation } from '@/components/hud/GameNavigation';
import { PlayerPanel } from '@/components/hud/PlayerPanel';
import { Menu } from '@/components/menu/Menu';
import { AudioSettings } from '@/components/settings/AudioSettings';
import { audioManager, SFX_ID } from '@/game/audio';
import type { CommandDispatcher, MenuId } from '@/game/core/command';
import type { SaveSlotSummary } from '@/game/save/save-types';
import type { GameState } from '@/game/core/game-state';
import { ChoicePanel } from './ChoicePanel';
import { InfoPanel } from './InfoPanel';
import { QuestLog } from './QuestLog';
import { LocationMap } from './LocationMap';
import { ShopPanel } from '@/components/shop/ShopPanel';
import { PeoplePanel } from '@/components/navigation/PeoplePanel';
import { HistoryPanel } from '@/components/navigation/HistoryPanel';
import { HubLocationNav } from './HubLocationNav';
import { LocationTitle } from './LocationTitle';
import { StoryPanel } from './StoryPanel';
import { InventoryPanel } from '@/components/navigation/InventoryPanel';
import type { StoryScreenView } from './types';
import styles from './StoryScreen.module.css';

interface StoryScreenProps {
  view: StoryScreenView;
  dispatch: CommandDispatcher;
  inputEnabled?: boolean;
  statusMessage?: string | null;
  fallbackNotice?: string | null;
  lockToken?: string;
  debugReason?: string | null;
  activeMenu?: MenuId | null;
  saveNotice?: string | null;
  slots?: readonly SaveSlotSummary[];
  gameState?: GameState;
}

export function StoryScreen({
  view,
  dispatch,
  inputEnabled = true,
  statusMessage = null,
  fallbackNotice = null,
  lockToken = '',
  debugReason = null,
  activeMenu = null,
  saveNotice = null,
  slots = [],
  gameState,
}: StoryScreenProps) {
  const todClass =
    view.timeOfDay === 'MORNING'
      ? styles.morning
      : view.timeOfDay === 'AFTERNOON'
        ? styles.afternoon
        : view.timeOfDay === 'EVENING'
          ? styles.evening
          : view.timeOfDay === 'NIGHT'
            ? styles.night
            : '';
  return (
    <div className={`${styles.screen} ${todClass}`.trim()}>
      <div className={styles.header}>
        <GameHeader
          locationName={view.locationName}
          title={view.chapterTitle ?? view.title}
          day={view.day}
          clock={view.clock}
          progressLabel={view.chapterProgressLabel}
        />
      </div>
      {saveNotice ? <p className={styles.notice}>{saveNotice}</p> : null}
      {fallbackNotice ? <p className={styles.fallback}>{fallbackNotice}</p> : null}
      <div className={styles.player}>
        <PlayerPanel player={view.player} onOpenCharacter={() => dispatch({ type: 'OPEN_MENU', menu: 'character' })} />
      </div>
      <div className={styles.story}>
        <LocationTitle locationId={view.locationId} locationName={view.locationName} />
        <StoryPanel locationId={view.locationId} story={view.story} statusMessage={statusMessage} />
      </div>
      <div className={styles.info}>
        <InfoPanel quest={view.quest} relations={view.relations} mainObjective={view.mainObjective} />
      </div>
      <div className={styles.choices}>
        {gameState ? <HubLocationNav state={gameState} dispatch={dispatch} disabled={!inputEnabled} /> : null}
        <ChoicePanel
          choices={view.choices}
          dispatch={dispatch}
          disabled={!inputEnabled}
          turnId={view.turnId}
          lockToken={lockToken}
          debugReason={debugReason}
        />
      </div>
      <div className={styles.nav}>
        <GameNavigation dispatch={dispatch} unspentStatPoints={view.player.unspentStatPoints} />
      </div>
      {activeMenu === 'character' && gameState ? (
        <CharacterPanel state={gameState} dispatch={dispatch} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'save' ? (
        <Menu dispatch={dispatch} slots={slots} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'quest' && gameState ? (
        <QuestLog state={gameState} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'map' && gameState ? (
        <LocationMap state={gameState} dispatch={dispatch} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'inventory' && gameState ? (
        <InventoryPanel state={gameState} dispatch={dispatch} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'shop' && gameState ? (
        <ShopPanel state={gameState} dispatch={dispatch} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'characters' && gameState ? (
        <PeoplePanel state={gameState} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'journal' && gameState ? (
        <HistoryPanel state={gameState} onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : activeMenu === 'settings' ? (
        <SettingsOverlay onClose={() => dispatch({ type: 'CLOSE_MENU' })} />
      ) : null}
    </div>
  );
}

function SettingsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.overlay}>
      <section className={styles.placeholder} aria-label="설정">
        <h2 className={styles.settingsTitle}>SETTINGS</h2>
        <AudioSettings />
        <button
          type="button"
          onClick={() => {
            audioManager.playSfx(SFX_ID.UI_CANCEL);
            onClose();
          }}
        >
          닫기
        </button>
      </section>
    </div>
  );
}
