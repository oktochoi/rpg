import type { ChoiceId } from '../core/ids';
import type { ChoiceSource } from './choices/choice-types';

export interface Choice {
  id: ChoiceId;
  label: string;
  source?: ChoiceSource;
  candidateId?: string;
  /** This choice is the one that advances the current step. */
  questStep?: boolean;
}
