import { DialogueBox } from '@/components/dialogue/DialogueBox';
import { NpcPortrait } from '@/components/dialogue/NpcPortrait';
import type { StoryPanelView } from './types';
import { StoryBackground } from './StoryBackground';
import styles from './StoryPanel.module.css';

interface StoryPanelProps {
  story: StoryPanelView;
  locationId: string;
  statusMessage?: string | null;
}

export function StoryPanel({ story, locationId, statusMessage = null }: StoryPanelProps) {
  const hasTranscript = story.messages.length > 0;

  return (
    <section className={styles.panel} aria-label="스토리">
      <div className={styles.background}>
        <StoryBackground locationId={locationId} />
        <div className={styles.portraitWrap}>
          <NpcPortrait emotion={story.npcEmotion} npcId={story.npcId} npcName={story.npcName} role={story.npcRole} />
        </div>
      </div>
      <div className={styles.body}>
        {hasTranscript ? (
          <div className={styles.transcript} aria-label="대화 기록">
            {story.messages.map((message, index) => (
              <p
                className={message.speaker === 'PLAYER' ? styles.playerTurn : styles.npcTurn}
                key={`${message.speaker}-${index}`}
              >
                <span className={styles.speaker}>
                  {message.speaker === 'PLAYER' ? 'Player' : story.npcName}
                </span>
                {message.text}
              </p>
            ))}
          </div>
        ) : (
          <DialogueBox npcName={story.npcName} dialogue={story.npcDialogue} />
        )}
        {story.lastActionNarrative ? <p className={styles.actionResult}>{story.lastActionNarrative}</p> : null}
        {statusMessage ? (
          <p className={styles.thinking} role="status">
            {statusMessage}
          </p>
        ) : null}
        <p className={styles.situation}>{story.situation}</p>
      </div>
    </section>
  );
}
