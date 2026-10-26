type CombatOutcomeHandlers = {
  retry: () => void;
  leave: () => void;
  proceed: () => void;
};

let handlers: CombatOutcomeHandlers | null = null;

export function setCombatOutcomeHandlers(next: CombatOutcomeHandlers | null): void {
  handlers = next;
}

export function requestCombatRetry(): void {
  handlers?.retry();
}

export function requestCombatLeave(): void {
  handlers?.leave();
}

export function requestCombatProceed(): void {
  handlers?.proceed();
}
