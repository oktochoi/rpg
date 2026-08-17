import { DialogueBox } from '@/components/dialogue/DialogueBox';
import { NpcPortrait } from '@/components/dialogue/NpcPortrait';
import type { StoryPanelView } from './types';
import styles from './StoryPanel.module.css';

interface StoryPanelProps {
  story: StoryPanelView;
}

export function StoryPanel({ story }: StoryPanelProps) {
  return (
    <section className={styles.panel} aria-label="스토리">
      <div className={styles.background}>
        <span className={styles.backgroundLabel}>Background</span>
        <div className={styles.portraitWrap}>
          <NpcPortrait npcName={story.npcName} />
        </div>
      </div>
      <div className={styles.body}>
        <DialogueBox npcName={story.npcName} dialogue={story.npcDialogue} />
        <p className={styles.situation}>{story.situation}</p>
      </div>
    </section>
  );
}
