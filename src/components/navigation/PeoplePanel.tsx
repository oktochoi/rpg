import type { GameState } from '@/game/core/game-state';
import { getNpcProfile } from '@/game/npc/npc-profiles';
import { relationshipBandLabel } from '@/game/relationships/relationship-selectors';
import { createRelationship } from '@/game/npc/relationship';
import { getLocationDefinition } from '@/game/world/locations/location-definitions';
import styles from '../story/StoryScreen.module.css';

interface PeoplePanelProps {
  state: GameState;
  onClose: () => void;
}

function attitudeLabel(npcId: string, state: GameState): string {
  return relationshipBandLabel(state.relationships[npcId] ?? createRelationship());
}

export function PeoplePanel({ state, onClose }: PeoplePanelProps) {
  const known = Object.values(state.npcs).filter((npc) => {
    const profile = getNpcProfile(npc.id);
    if (!profile) {
      return false;
    }
    const location = state.world.locations[npc.locationId];
    return location?.visited === true;
  });

  return (
    <div className={styles.overlay}>
      <section className={styles.placeholder} aria-label="인물">
        <h2>인물</h2>
        {known.length === 0 ? <p>아직 기록된 인물이 없습니다.</p> : null}
        <ul>
          {known.map((npc) => {
            const profile = getNpcProfile(npc.id);
            const location = getLocationDefinition(npc.locationId);
            const knownLocation = state.world.locations[npc.locationId]?.visited === true;
            return (
              <li key={npc.id}>
                <p>
                  {profile?.name ?? npc.name}
                  {profile?.role ? ` · ${profile.role}` : ''}
                </p>
                <p>관계: {attitudeLabel(npc.id, state)}</p>
                {knownLocation ? <p>현재 위치: {location?.name ?? '알 수 없음'}</p> : null}
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
