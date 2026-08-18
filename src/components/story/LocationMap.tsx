import type { GameState } from '@/game/core/game-state';
import type { CommandDispatcher } from '@/game/core/command';
import { LOCATION_DEFINITIONS, getLocationDefinition } from '@/game/world/locations/location-definitions';
import { accessRequirementsMet, isLocationDiscovered } from '@/game/world/locations/location-selectors';
import styles from './StoryScreen.module.css';

interface LocationMapProps {
  state: GameState;
  dispatch: CommandDispatcher;
  onClose: () => void;
}

export function LocationMap({ state, dispatch, onClose }: LocationMapProps) {
  const current = getLocationDefinition(state.world.currentLocationId);
  const currentRuntime = state.world.locations[state.world.currentLocationId];
  const known = Object.values(LOCATION_DEFINITIONS).filter((definition) => {
    const runtime = state.world.locations[definition.id];
    return runtime?.discovered || runtime?.visited || definition.id === state.world.currentLocationId || !definition.discoveryRequired;
  });

  return (
    <div className={styles.overlay}>
      <section className={styles.placeholder} aria-label="지도">
        <h2>지도</h2>
        <p>
          현재 위치: {current?.name ?? state.world.currentLocationId}
          {currentRuntime?.visited ? ' [현재 위치]' : ''}
        </p>
        <ul>
          {known.map((definition) => {
            const runtime = state.world.locations[definition.id];
            const here = definition.id === state.world.currentLocationId;
            const locked = !accessRequirementsMet(state, definition.accessRequirements);
            const discovered = isLocationDiscovered(state, definition.id) || !definition.discoveryRequired;
            const label = discovered ? definition.name : '알 수 없는 길';
            const connected = current?.connectedLocationIds.includes(definition.id);
            return (
              <li key={definition.id}>
                {here ? '● ' : connected ? '├ ' : '○ '}
                {label}
                {here ? ' [현재 위치]' : ''}
                {locked ? ' [잠김]' : ''}
                {!here && connected && !locked ? (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'MOVE_TO_LOCATION', locationId: definition.id });
                      onClose();
                    }}
                  >
                    이동
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </section>
    </div>
  );
}
