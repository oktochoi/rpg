import { NpcPortrait } from '@/components/dialogue/NpcPortrait';
import type { StoryPanelView } from './types';
import styles from './StoryPanel.module.css';

interface StoryPanelProps {
  story: StoryPanelView;
  statusMessage?: string | null;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function keepBreaks(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

/** Dialogue dock under the scene. The background stays in the main view. */
export function StoryPanel({ story, statusMessage = null }: StoryPanelProps) {
  const recent = story.messages.slice(-1);
  const hasTranscript = recent.length > 0;
  const lastMessageText = normalizeText(recent[recent.length - 1]?.text);
  const npcDialogue = normalizeText(story.npcDialogue);
  const spoken = hasTranscript ? lastMessageText : npcDialogue;
  const sceneNote = keepBreaks(story.situation || story.lastActionNarrative);
  const showSceneNote = sceneNote.length > 0 && normalizeText(sceneNote) !== spoken;
  const speaker = spoken
    ? hasTranscript
      ? recent[0]?.speaker === 'PLAYER'
        ? '플레이어'
        : story.npcName
      : story.npcName
    : null;

  return (
    <section className={styles.dock} aria-label="대화">
      {speaker && story.npcName ? (
        <NpcPortrait dock emotion={story.npcEmotion} npcId={story.npcId} npcName={story.npcName} role={story.npcRole} />
      ) : null}
      <div className={styles.copy}>
        {speaker ? <p className={styles.speaker}>{speaker}</p> : null}
        {showSceneNote ? <p className={styles.note}>{sceneNote}</p> : null}
        {spoken ? (
          <p className={hasTranscript && recent[0]?.speaker === 'PLAYER' ? styles.playerLine : styles.line}>
            {hasTranscript ? recent[0]?.text : story.npcDialogue}
          </p>
        ) : null}
        {statusMessage ? (
          <p className={styles.thinking} role="status">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
