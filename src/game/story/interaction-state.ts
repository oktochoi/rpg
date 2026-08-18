import type { GameMode } from '../core/game-mode';
import type { GameState } from '../core/game-state';

export interface InteractionUiFlags {
  inGame?: boolean;
  talking?: boolean;
  directorLoading?: boolean;
  candidateCount?: number;
}

export interface InteractionState {
  canInteract: boolean;
  reason: string | null;
  mode: GameMode;
  isResolving: boolean;
  hasCandidates: boolean;
  canUseFreeInput: boolean;
}

export function selectInteractionState(
  state: Readonly<GameState>,
  ui: InteractionUiFlags = {}
): InteractionState {
  const inGame = ui.inGame !== false;
  const talking = ui.talking === true;
  const directorLoading = ui.directorLoading === true;
  const hasCandidates = (ui.candidateCount ?? 1) > 0;
  const isResolving = state.mode === 'RESOLVING';
  const combat = state.mode === 'COMBAT';

  let reason: string | null = null;
  if (!inGame) {
    reason = 'not_in_game';
  } else if (combat) {
    reason = 'combat';
  } else if (isResolving) {
    reason = 'resolving';
  } else if (talking) {
    reason = 'npc_thinking';
  } else if (directorLoading) {
    reason = 'director_loading';
  }

  const canInteract = reason === null;
  return {
    canInteract,
    reason,
    mode: state.mode,
    isResolving,
    hasCandidates,
    canUseFreeInput: canInteract,
  };
}

export function interactionStatusMessage(
  state: Readonly<GameState>,
  ui: InteractionUiFlags & { npcName?: string }
): string | null {
  const interaction = selectInteractionState(state, ui);
  if (interaction.reason === 'npc_thinking') {
    return `${ui.npcName ?? 'NPC'}가 잠시 생각한다...`;
  }
  if (interaction.reason === 'resolving' || interaction.reason === 'director_loading') {
    return '처리 중...';
  }
  return null;
}
