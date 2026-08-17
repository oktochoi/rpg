import { useState } from 'react';
import dynamic from 'next/dynamic';
import { StoryScreen } from '@/components/story/StoryScreen';
import { STORY_SCREEN_PLACEHOLDER } from '@/components/story/placeholders';
import type { CommandDispatcher } from '@/game/core/command';
import styles from './App.module.css';

const CombatView = dynamic(
  () => import('@/components/combat/CombatView').then((module) => module.CombatView),
  { ssr: false }
);

const dispatch: CommandDispatcher = () => {
  // UI-only: Commands are accepted here and must not mutate GameState.
};

function App() {
  const [isCombatTest, setIsCombatTest] = useState(false);

  return (
    <div id="app">
      {isCombatTest ? (
        <CombatView onClose={() => setIsCombatTest(false)} />
      ) : (
        <>
          <StoryScreen view={STORY_SCREEN_PLACEHOLDER} dispatch={dispatch} />
          <button
            className={styles.testButton}
            type="button"
            onClick={() => setIsCombatTest(true)}
          >
            전투 테스트
          </button>
        </>
      )}
    </div>
  );
}

export default App;
