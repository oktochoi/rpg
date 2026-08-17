import styles from './dialogue.module.css';

interface DialogueBoxProps {
  npcName: string;
  dialogue: string;
}

export function DialogueBox({ npcName, dialogue }: DialogueBoxProps) {
  return (
    <div className={styles.box}>
      <p className={styles.speaker}>{npcName}</p>
      <p className={styles.line}>{dialogue}</p>
    </div>
  );
}
