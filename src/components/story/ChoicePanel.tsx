import { useEffect, useState } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import type { CommandDispatcher } from '@/game/core/command';
import type { Choice } from '@/game/story/choice';
import { directorChoiceDebugEnabled } from '@/game/story/choices/choice-priority';
import { FreeActionInput } from './FreeActionInput';
import styles from './ChoicePanel.module.css';

interface ChoicePanelProps {
  choices: readonly Choice[];
  dispatch: CommandDispatcher;
  disabled?: boolean;
  turnId: number;
}

export function ChoicePanel({ choices, dispatch, disabled = false, turnId }: ChoicePanelProps) {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
  }, [turnId, disabled]);

  const inactive = disabled || locked;

  const selectChoice = (choice: Choice) => {
    if (inactive) {
      return;
    }
    setLocked(true);
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CONFIRM);
    dispatch({
      type: 'SELECT_DYNAMIC_CHOICE',
      choiceId: choice.id,
      turnId,
      candidateId: choice.candidateId ?? choice.id,
    });
  };

  useEffect(() => {
    if (inactive) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      const index = Number(event.key) - 1;
      if (index < 0 || index > 2 || !choices[index]) {
        return;
      }
      event.preventDefault();
      selectChoice(choices[index]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices, inactive, turnId]);

  return (
    <section className={styles.panel} aria-label="선택지">
      {choices.map((choice, index) => (
        <button
          className={styles.choice}
          key={choice.id}
          type="button"
          disabled={inactive}
          onClick={() => selectChoice(choice)}
        >
          <span className={styles.index}>{index + 1}</span>
          <span className={styles.label}>{choice.label}</span>
          {directorChoiceDebugEnabled() && choice.source ? (
            <span className={styles.source}>[{choice.source}]</span>
          ) : null}
        </button>
      ))}
      <FreeActionInput dispatch={dispatch} disabled={inactive} turnId={turnId} />
    </section>
  );
}
