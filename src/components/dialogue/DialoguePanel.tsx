import { DialogueBox } from './DialogueBox';
import { NpcPortrait } from './NpcPortrait';
import styles from './dialogue.module.css';

interface DialoguePanelProps {
  npcName: string;
  dialogue: string;
}

export function DialoguePanel({ npcName, dialogue }: DialoguePanelProps) {
  return (
    <div className={styles.dialogue}>
      <NpcPortrait npcName={npcName} />
      <DialogueBox npcName={npcName} dialogue={dialogue} />
    </div>
  );
}
