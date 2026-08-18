import { useEffect, useState } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import type { CommandDispatcher } from '@/game/core/command';
import type { Choice } from '@/game/story/choice';
import { directorChoiceDebugEnabled } from '@/game/story/choices/choice-priority';
import { resolvePlayerFacingChoiceLabel } from '@/game/story/choices/choice-label';
import { FreeActionInput } from './FreeActionInput';
import styles from './ChoicePanel.module.css';

interface ChoicePanelProps {
  choices: readonly Choice[];
  dispatch: CommandDispatcher;
  disabled?: boolean;
  turnId: number;
  lockToken?: string;
  debugReason?: string | null;
}

export function ChoicePanel({
  choices,
  dispatch,
  disabled = false,
  turnId,
  lockToken = '',
  debugReason = null,
}: ChoicePanelProps) {
  const [locked, setLocked] = useState(false);
  const choiceIds = choices.map((choice) => choice.id).join('|');

  useEffect(() => {
    setLocked(false);
  }, [turnId, disabled, lockToken, choiceIds]);

  useEffect(() => {
    if (!locked) {
      return;
    }
    const timer = window.setTimeout(() => setLocked(false), 8000);
    return () => window.clearTimeout(timer);
  }, [locked]);

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

  const continueOnly =
    choices.length === 1 &&
    (choices[0]?.label === '계속' || choices[0]?.candidateId === 'story_continue' || choices[0]?.candidateId === 'intro_continue');

  return (
    <section className={`${styles.panel} ${continueOnly ? styles.continuePanel : ''}`} aria-label="선택지">
      {choices.map((choice, index) => (
        <button
          className={`${styles.choice} ${continueOnly ? styles.continue : ''}`}
          key={choice.id}
          type="button"
          disabled={inactive}
          onClick={() => selectChoice(choice)}
        >
          {continueOnly ? null : <span className={styles.index}>{index + 1}</span>}
          <span className={styles.label}>
            {resolvePlayerFacingChoiceLabel({ text: choice.label, candidateId: choice.candidateId })}
          </span>
          {directorChoiceDebugEnabled() && choice.source ? (
            <span className={styles.source}>[{choice.source}]</span>
          ) : null}
        </button>
      ))}
      <FreeActionInput dispatch={dispatch} disabled={inactive} turnId={turnId} lockToken={lockToken} />
      {directorChoiceDebugEnabled() && debugReason ? (
        <p className={styles.source}>lock {debugReason} turn {turnId}</p>
      ) : null}
    </section>
  );
}
