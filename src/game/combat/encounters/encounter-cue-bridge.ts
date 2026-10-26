import { EventBus } from '../../EventBus';
import type { EncounterStartPhase } from './encounter-intro';

export const ENCOUNTER_CUE_EVENT = 'encounter-cue';

export interface EncounterCue {
  phase: EncounterStartPhase;
  line: string;
  boss: boolean;
}

let lastCue: EncounterCue | null = null;

export function publishEncounterCue(cue: EncounterCue): void {
  lastCue = cue;
  EventBus.emit(ENCOUNTER_CUE_EVENT, cue);
}

export function subscribeEncounterCue(handler: (cue: EncounterCue) => void): () => void {
  if (lastCue) {
    handler(lastCue);
  }
  EventBus.on(ENCOUNTER_CUE_EVENT, handler);
  return () => {
    EventBus.off(ENCOUNTER_CUE_EVENT, handler);
  };
}

export function clearEncounterCue(): void {
  lastCue = null;
}
