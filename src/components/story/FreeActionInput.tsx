import { useState, type FormEvent } from 'react';
import type { CommandDispatcher } from '@/game/core/command';
import styles from './FreeActionInput.module.css';

interface FreeActionInputProps {
  dispatch: CommandDispatcher;
}

export function FreeActionInput({ dispatch }: FreeActionInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextText = text.trim();
    if (!nextText) {
      return;
    }
    dispatch({ type: 'SUBMIT_FREE_INPUT', text: nextText });
    setText('');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        name="free-action"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="무엇을 할까?"
        aria-label="자유 행동"
        autoComplete="off"
      />
      <button className={styles.submit} type="submit">
        행동
      </button>
    </form>
  );
}
