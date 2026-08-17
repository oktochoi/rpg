import { GameHeader } from '@/components/hud/GameHeader';
import { GameNavigation } from '@/components/hud/GameNavigation';
import { PlayerPanel } from '@/components/hud/PlayerPanel';
import type { CommandDispatcher } from '@/game/core/command';
import { ChoicePanel } from './ChoicePanel';
import { InfoPanel } from './InfoPanel';
import { StoryPanel } from './StoryPanel';
import type { StoryScreenView } from './types';
import styles from './StoryScreen.module.css';

interface StoryScreenProps {
  view: StoryScreenView;
  dispatch: CommandDispatcher;
}

export function StoryScreen({ view, dispatch }: StoryScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <GameHeader locationName={view.locationName} title={view.title} day={view.day} />
      </div>
      <div className={styles.player}>
        <PlayerPanel player={view.player} />
      </div>
      <div className={styles.story}>
        <StoryPanel story={view.story} />
      </div>
      <div className={styles.info}>
        <InfoPanel quest={view.quest} relations={view.relations} />
      </div>
      <div className={styles.choices}>
        <ChoicePanel choices={view.choices} dispatch={dispatch} />
      </div>
      <div className={styles.nav}>
        <GameNavigation dispatch={dispatch} />
      </div>
    </div>
  );
}
