import { useEffect, useState } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import type { CommandDispatcher } from '@/game/core/command';
import type { GameState } from '@/game/core/game-state';
import { getLocationDefinition, LOCATION_ID, WORLD_FLAG } from '@/game/world/locations/location-definitions';
import { hubTravelDestinations, isHubLocation, worldFlag } from '@/game/world/locations/location-selectors';
import { getStorySceneDefinition } from '@/game/story/story-scene-definitions';
import { getGamePhase, GAME_PHASE } from '@/game/story/game-phase';
import { QUEST_ID } from '@/game/quests/quest-definitions';
import { QUEST_STATUS } from '@/game/quests/quest-types';
import { isRuinsKeyHuntActive, playerHasRuinsKey } from '@/game/quests/ruins-key-hunt';
import { getQuestStepMark } from '@/game/story/chapters/main-objective';
import { GameIcon, type GameIconName } from '@/components/ui/GameIcon';
import styles from './HubLocationNav.module.css';

interface HubLocationNavProps {
  state: GameState;
  dispatch: CommandDispatcher;
  disabled?: boolean;
  choiceLabels?: readonly string[];
}

const PLACE_HINT: Record<string, readonly string[]> = {
  [LOCATION_ID.LUEN_VILLAGE]: ['마을로'],
  [LOCATION_ID.LUEN_ADVENTURERS_GUILD]: ['길드'],
  [LOCATION_ID.BLUE_MOON_INN]: ['여관'],
  [LOCATION_ID.LUEN_GENERAL_STORE]: ['상점', '잡화'],
  [LOCATION_ID.LUEN_TRAINING_GROUND]: ['훈련'],
  [LOCATION_ID.FOREST_ROAD]: ['숲', '모험 출발', '모험을', '열쇠', '폐허로', '정찰'],
  [LOCATION_ID.NORTHERN_GATE]: ['북문'],
};

function forestDepartureLabel(state: GameState): string {
  if (isRuinsKeyHuntActive(state)) {
    return '열쇠를 찾으러';
  }
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
  if (
    playerHasRuinsKey(state) &&
    ruins?.status === QUEST_STATUS.ACTIVE &&
    !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)
  ) {
    return '폐허로 향한다';
  }
  const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
  if (forest?.status === QUEST_STATUS.ACTIVE && forest.objectiveProgress.win_scouts?.completed !== true) {
    return '정찰을 나선다';
  }
  return '숲으로 간다';
}

/** Village hub travel — only during VILLAGE phase. */
export function HubLocationNav({ state, dispatch, disabled = false, choiceLabels = [] }: HubLocationNavProps) {
  const [locked, setLocked] = useState(false);
  const locationKey = state.world.currentLocationId;
  const turn = state.world.turn;

  useEffect(() => {
    setLocked(false);
  }, [locationKey, turn, disabled]);

  if (getGamePhase(state) !== GAME_PHASE.VILLAGE) {
    return null;
  }
  if (!isHubLocation(state.world.currentLocationId)) {
    return null;
  }
  const scene = getStorySceneDefinition(state.story.currentSceneId);
  if (scene?.autoContinue) {
    return null;
  }
  const current = getLocationDefinition(state.world.currentLocationId);
  if (!current) {
    return null;
  }
  const shortName: Record<string, string> = {
    [LOCATION_ID.LUEN_VILLAGE]: '마을로 나간다',
    [LOCATION_ID.LUEN_ADVENTURERS_GUILD]: '길드',
    [LOCATION_ID.BLUE_MOON_INN]: '여관',
    [LOCATION_ID.LUEN_GENERAL_STORE]: '상점',
    [LOCATION_ID.LUEN_TRAINING_GROUND]: '훈련장',
    [LOCATION_ID.FOREST_ROAD]: forestDepartureLabel(state),
    [LOCATION_ID.NORTHERN_GATE]: '북문',
  };
  const iconName: Record<string, GameIconName> = {
    [LOCATION_ID.LUEN_VILLAGE]: 'village',
    [LOCATION_ID.LUEN_ADVENTURERS_GUILD]: 'guild',
    [LOCATION_ID.BLUE_MOON_INN]: 'inn',
    [LOCATION_ID.LUEN_GENERAL_STORE]: 'shop',
    [LOCATION_ID.LUEN_TRAINING_GROUND]: 'training',
    [LOCATION_ID.FOREST_ROAD]: 'travel',
    [LOCATION_ID.NORTHERN_GATE]: 'gate',
  };
  const stepLocationId = getQuestStepMark(state)?.locationId ?? null;
  const destinations = hubTravelDestinations(state).filter((locationId) => {
    const hints = PLACE_HINT[locationId] ?? [];
    return !hints.some((hint) => choiceLabels.some((label) => label.includes(hint)));
  });
  if (destinations.length === 0) {
    return null;
  }

  const inactive = disabled || locked;

  const travel = (locationId: string) => {
    if (inactive) {
      return;
    }
    setLocked(true);
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CONFIRM);
    dispatch({ type: 'MOVE_TO_LOCATION', locationId });
    window.setTimeout(() => setLocked(false), 420);
  };

  return (
    <nav className={styles.nav} aria-label="장소 이동">
      <div className={styles.row}>
        {destinations.map((locationId) => {
          const definition = getLocationDefinition(locationId);
          return (
            <button
              key={locationId}
              type="button"
              className={`${styles.button} ${locationId === stepLocationId ? styles.questStep : ''}`}
              disabled={inactive}
              onClick={() => travel(locationId)}
            >
              {locationId === stepLocationId ? <span className={styles.mark}>목표</span> : null}
              <GameIcon name={iconName[locationId] ?? 'travel'} />
              <span>{shortName[locationId] ?? definition?.name ?? '이동'}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
