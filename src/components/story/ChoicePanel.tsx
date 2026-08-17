import type { CommandDispatcher } from '@/game/core/command';
import type { Choice } from '@/game/story/choice';
import { FreeActionInput } from './FreeActionInput';
import styles from './ChoicePanel.module.css';

interface ChoicePanelProps {
  choices: readonly [Choice, Choice, Choice];
  dispatch: CommandDispatcher;
}

export function ChoicePanel({ choices, dispatch }: ChoicePanelProps) {
  return (
    <section className={styles.panel} aria-label="선택지">
      {choices.map((choice, index) => (
        <button
          className={styles.choice}
          key={choice.id}
          type="button"
          onClick={() => dispatch({ type: 'SELECT_CHOICE', choiceId: choice.id })}
        >
          <span className={styles.index}>{index + 1}</span>
          <span className={styles.label}>{choice.label}</span>
        </button>
      ))}
      <FreeActionInput dispatch={dispatch} />
    </section>
  );
}
