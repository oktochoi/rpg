import type { GameState } from '@/game/core/game-state';
import { getNpcProfile } from '@/game/npc/npc-profiles';
import { attitudeFromRelationship } from '@/game/relationships/relationship-selectors';
import { createRelationship } from '@/game/npc/relationship';
import { getLocationDefinition } from '@/game/world/locations/location-definitions';
import styles from '../story/StoryScreen.module.css';

interface PeoplePanelProps {
  state: GameState;
  onClose: () => void;
}

function attitudeLabel(npcId: string, state: GameState): string {
  const value = state.relationships[npcId] ?? createRelationship();
  const attitude = attitudeFromRelationship(value);
  if (attitude === 'FRIENDLY') {
    return '신뢰 있음';
  }
  if (attitude === 'SUSPICIOUS') {
    return '경계';
  }
  if (attitude === 'HOSTILE') {
    return '적대';
  }
  if (attitude === 'AFRAID') {
    return '두려움';
  }
  if (attitude === 'RESPECTFUL') {
    return '인정';
  }
  return '아는 사이';
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
