import { useEffect, useState } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import type { CommandDispatcher } from '@/game/core/command';
import type { Choice } from '@/game/story/choice';
import { directorChoiceDebugEnabled } from '@/game/story/choices/choice-priority';
import { resolvePlayerFacingChoiceLabel } from '@/game/story/choices/choice-label';
import styles from './ChoicePanel.module.css';

interface ChoicePanelProps {
  choices: readonly Choice[];
  dispatch: CommandDispatcher;
  disabled?: boolean;
  turnId: number;
  lockToken?: string;
  debugReason?: string | null;
  stepHints?: readonly string[];
}

export function ChoicePanel({
  choices,
  dispatch,
  disabled = false,
  turnId,
  lockToken = '',
  debugReason = null,
  stepHints = [],
}: ChoicePanelProps) {
  const [locked, setLocked] = useState(false);
  const choiceIds = choices.map((choice) => choice.id).join('|');
  const count = Math.max(1, Math.min(3, choices.length || 1));

  useEffect(() => {
    setLocked(false);
  }, [turnId, disabled, lockToken, choiceIds]);

  const inactive = disabled || locked;

  const selectChoice = (choice: Choice) => {
    if (inactive) {
      return;
    }
    setLocked(true);
    audioManager.unlock();
    audioManager.playSfx(SFX_ID.UI_CONFIRM);
    dispatch({
      type: 'SELECT_CHOICE',
      choiceId: choice.id,
    });
    // Stay locked until turn/lockToken changes (parent clears after staged transition).
    // Fallback unlock avoids soft-lock if dispatch is a no-op.
    window.setTimeout(() => setLocked(false), 420);
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
    (choices[0]?.label === '계속' || choices[0]?.label === '계속 이동한다');
  const flagged = choices.some((choice) => choice.questStep);
  const hintedId = flagged
    ? undefined
    : choices.find((choice) => {
        const label = resolvePlayerFacingChoiceLabel({ text: choice.label, candidateId: choice.candidateId });
        return stepHints.some((hint) => label.includes(hint));
      })?.id;

  const isQuestStep = (choice: Choice) => !continueOnly && (choice.questStep === true || choice.id === hintedId);

  return (
    <section
      className={styles.panel}
      style={{ ['--choice-count' as string]: String(count) }}
      data-count={count}
      aria-label="선택지"
    >
      {choices.map((choice, index) => (
        <button
          className={`${styles.choice} ${continueOnly ? styles.continue : ''} ${isQuestStep(choice) ? styles.questStep : ''}`}
          key={choice.id}
          type="button"
          disabled={inactive}
          onClick={() => selectChoice(choice)}
        >
          {isQuestStep(choice) ? <span className={styles.mark}>목표</span> : null}
          {continueOnly ? null : <span className={styles.index}>{index + 1}</span>}
          <span className={styles.label}>
            {resolvePlayerFacingChoiceLabel({ text: choice.label, candidateId: choice.candidateId })}
          </span>
          {directorChoiceDebugEnabled() && choice.source ? (
            <span className={styles.source}>[{choice.source}]</span>
          ) : null}
        </button>
      ))}
      {directorChoiceDebugEnabled() && debugReason ? (
        <p className={styles.source}>
          lock {debugReason} turn {turnId}
        </p>
      ) : null}
    </section>
  );
}
