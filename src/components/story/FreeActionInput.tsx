import { useEffect, useState, type FormEvent } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import type { CommandDispatcher } from '@/game/core/command';
import styles from './FreeActionInput.module.css';

interface FreeActionInputProps {
  dispatch: CommandDispatcher;
  disabled?: boolean;
  turnId: number;
}

export function FreeActionInput({ dispatch, disabled = false, turnId }: FreeActionInputProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSubmitting(false);
  }, [turnId, disabled]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || submitting) {
      return;
    }
    const nextText = text.trim();
    if (!nextText) {
      return;
    }
    setSubmitting(true);
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CONFIRM);
    dispatch({ type: 'FREE_ACTION', turnId, input: nextText });
    setText('');
  };

  const locked = disabled || submitting;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        name="free-action"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="직접 행동하거나 말해보세요..."
        aria-label="자유 행동"
        autoComplete="off"
        disabled={locked}
      />
      <button className={styles.submit} type="submit" disabled={locked}>
        행동
      </button>
    </form>
  );
}
