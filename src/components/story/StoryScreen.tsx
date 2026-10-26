import { CharacterPanel } from '@/components/character/CharacterPanel';
import { GameHeader } from '@/components/hud/GameHeader';
import { GameNavigation } from '@/components/hud/GameNavigation';
import { PlayerPanel } from '@/components/hud/PlayerPanel';
import { AudioSettings } from '@/components/settings/AudioSettings';
import type { CommandDispatcher, MenuId } from '@/game/core/command';
import type { GameState } from '@/game/core/game-state';
import { getQuestStepMark } from '@/game/story/chapters/main-objective';
import { ChoicePanel } from './ChoicePanel';
import { QuestLog } from './QuestLog';
import { ShopPanel } from '@/components/shop/ShopPanel';
import { HubLocationNav } from './HubLocationNav';
import { StoryBackground } from './StoryBackground';
import { StoryPanel } from './StoryPanel';
import { InventoryPanel } from '@/components/navigation/InventoryPanel';
import { GameModal } from '@/components/ui/GameModal';
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
  const closeMenu = () => dispatch({ type: 'CLOSE_MENU' });

  return (
    <div className={`${styles.screen} ${todClass}`.trim()} data-phase={view.story.gamePhase}>
      <GameHeader
        locationName={view.locationName}
        title={view.chapterTitle ?? view.title}
        day={view.day}
        clock={view.clock}
        progressLabel={view.chapterProgressLabel}
      />
      {saveNotice ? <p className={styles.notice}>{saveNotice}</p> : null}
      {fallbackNotice ? <p className={styles.fallback}>{fallbackNotice}</p> : null}
      {view.suggestedNextAction ? (
        <aside className={styles.nextStep} aria-label="다음 할 일">
          <p className={styles.nextKicker}>다음</p>
          <p className={styles.nextBody}>{view.suggestedNextAction}</p>
        </aside>
      ) : null}
      <div className={styles.stage}>
        <div className={styles.scene}>
          <StoryBackground locationId={view.locationId} />
          <div className={styles.status}>
            <PlayerPanel
              player={view.player}
              variant="scene"
              onOpenCharacter={() => dispatch({ type: 'OPEN_MENU', menu: 'character' })}
            />
          </div>
          {showsStandingHero(view.locationId) ? (
            <button
              type="button"
              className={styles.heroButton}
              onClick={() => dispatch({ type: 'OPEN_MENU', menu: 'character' })}
              aria-label="캐릭터 화면 열기"
            >
              <img className={styles.hero} src="/assets/characters/hero_swordsman/hero_fullbody.png" alt="" />
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles.lower}>
        <div className={styles.dialogue}>
          <StoryPanel story={view.story} statusMessage={statusMessage} />
        </div>
        <div
          className={styles.actionRow}
          data-count={view.choices.length}
          data-hub={gameState && view.story.gamePhase === 'VILLAGE' ? '1' : '0'}
        >
          <ChoicePanel
            choices={view.choices}
            dispatch={dispatch}
            disabled={!inputEnabled}
            turnId={view.turnId}
            lockToken={lockToken}
            debugReason={debugReason}
            stepHints={gameState ? (getQuestStepMark(gameState)?.hints ?? []) : []}
          />
          {gameState && view.story.gamePhase === 'VILLAGE' ? (
            <HubLocationNav
              state={gameState}
              dispatch={dispatch}
              disabled={!inputEnabled}
              choiceLabels={view.choices.map((choice) => choice.label)}
            />
          ) : null}
        </div>
        <div className={styles.nav}>
          <GameNavigation dispatch={dispatch} unspentStatPoints={view.player.unspentStatPoints} />
        </div>
      </div>
      {activeMenu === 'character' && gameState ? (
        <CharacterPanel state={gameState} dispatch={dispatch} onClose={closeMenu} />
      ) : activeMenu === 'quest' && gameState ? (
        <QuestLog state={gameState} onClose={closeMenu} />
      ) : activeMenu === 'inventory' && gameState ? (
        <InventoryPanel state={gameState} dispatch={dispatch} onClose={closeMenu} />
      ) : activeMenu === 'shop' && gameState ? (
        <ShopPanel state={gameState} dispatch={dispatch} onClose={closeMenu} />
      ) : activeMenu === 'settings' ? (
        <GameModal title="설정" kicker="환경" size="md" onClose={closeMenu}>
          <AudioSettings />
        </GameModal>
      ) : null}
    </div>
  );
}

/** Shop painting already shows Elin, so a second standing figure covers her. */
function showsStandingHero(locationId: string): boolean {
  return locationId !== 'luen_general_store';
}
