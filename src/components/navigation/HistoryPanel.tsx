import type { GameState } from '@/game/core/game-state';
import { getLocationDefinition } from '@/game/world/locations/location-definitions';
import styles from '../story/StoryScreen.module.css';

interface HistoryPanelProps {
  state: GameState;
  onClose: () => void;
}

export function HistoryPanel({ state, onClose }: HistoryPanelProps) {
  const entries = state.history ?? [];
  const grouped = new Map<number, typeof entries>();
  for (const entry of entries) {
    const list = grouped.get(entry.day) ?? [];
    grouped.set(entry.day, [...list, entry]);
  }

  return (
    <div className={styles.overlay}>
      <section className={styles.placeholder} aria-label="기록">
        <h2>기록</h2>
        {entries.length === 0 ? <p>아직 기록된 사건이 없습니다.</p> : null}
        {[...grouped.entries()].map(([day, list]) => (
          <div key={day}>
            <p>DAY {day}</p>
            <ul>
              {list.map((entry) => {
                const location = entry.locationId ? getLocationDefinition(entry.locationId)?.name : null;
                return (
                  <li key={entry.id}>
                    {entry.clock ? `${entry.clock} ` : ''}
                    {location ? `${location} — ` : ''}
                    {entry.summary}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </section>
    </div>
  );
}
