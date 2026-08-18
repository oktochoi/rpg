import type { CommandDispatcher } from '@/game/core/command';
import type { GameState } from '@/game/core/game-state';
import { getLocationDefinition } from '@/game/world/locations/location-definitions';
import { hubTravelDestinations, isHubLocation } from '@/game/world/locations/location-selectors';
import styles from './HubLocationNav.module.css';

interface HubLocationNavProps {
  state: GameState;
  dispatch: CommandDispatcher;
  disabled?: boolean;
}

export function HubLocationNav({ state, dispatch, disabled = false }: HubLocationNavProps) {
  if (!isHubLocation(state.world.currentLocationId)) {
    return null;
  }
  const current = getLocationDefinition(state.world.currentLocationId);
  if (!current) {
    return null;
  }
  const destinations = hubTravelDestinations(state);
  if (destinations.length === 0) {
    return null;
  }

  return (
    <nav className={styles.nav} aria-label="장소 이동">
      <p className={styles.title}>{current.name}</p>
      <div className={styles.row}>
        {destinations.map((locationId) => {
          const definition = getLocationDefinition(locationId);
          return (
            <button
              key={locationId}
              type="button"
              className={styles.button}
              disabled={disabled}
              onClick={() => dispatch({ type: 'MOVE_TO_LOCATION', locationId })}
            >
              {definition?.name ?? '이동'}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
