import type { Command } from '../core/command';
import type { GameState } from '../core/game-state';
import { getLocationDefinition } from '../world/locations/location-definitions';
import { findAvailableChoiceDefinition } from '../story/story-choice-service';
import { resolveStoryBackground } from '../visual/story-background';
import { withEuro } from '../text/korean-josa';

export type ActionTransitionKind = 'move' | 'investigate' | 'combat' | 'short' | 'none';

export interface ActionTransitionSpec {
  kind: ActionTransitionKind;
  durationMs: number;
  title: string;
  detail?: string;
  /** Destination or scene illustration. Replaces the old walking blob. */
  art?: string;
  /** CSS phase labels for overlay animation. */
  phases: readonly string[];
}

const NONE: ActionTransitionSpec = {
  kind: 'none',
  durationMs: 0,
  title: '',
  phases: [],
};

export function resolveActionTransition(
  state: Readonly<GameState>,
  command: Command
): ActionTransitionSpec {
  if (command.type === 'MOVE_TO_LOCATION') {
    const from = getLocationDefinition(state.world.currentLocationId)?.name ?? '현재 위치';
    const to = getLocationDefinition(command.locationId)?.name ?? '목적지';
    const forestBound = command.locationId.includes('forest') || command.locationId.includes('ruins');
    return {
      kind: 'move',
      durationMs: forestBound ? 900 : 520,
      title: `${withEuro(to)} 이동`,
      detail: `${from} → ${to}`,
      art: resolveStoryBackground(command.locationId).path,
      phases: ['walk', 'fade', 'arrive'],
    };
  }

  if (command.type === 'START_COMBAT') {
    // CombatView plays an encounter-specific intro. A second generic card here always looked the same.
    return NONE;
  }

  if (command.type !== 'SELECT_CHOICE') {
    return NONE;
  }

  const definition = findAvailableChoiceDefinition(state, command.choiceId);
  if (!definition) {
    return {
      kind: 'short',
      durationMs: 380,
      title: '',
      phases: ['pulse'],
    };
  }

  const action = definition.action;
  if (action.type === 'MOVE_TO_LOCATION') {
    return resolveActionTransition(state, { type: 'MOVE_TO_LOCATION', locationId: action.locationId });
  }
  if (action.type === 'START_COMBAT') {
    return resolveActionTransition(state, { type: 'START_COMBAT', combatId: action.combatId });
  }
  if (action.type === 'INVESTIGATE' || action.type === 'LOOK_AROUND') {
    return {
      kind: 'investigate',
      durationMs: 900,
      title: action.type === 'LOOK_AROUND' ? '주변을 살핀다' : '조사한다',
      detail: definition.text,
      phases: ['approach', 'inspect', 'reveal'],
    };
  }
  if (action.type === 'CONTINUE' || action.type === 'TALK' || action.type === 'ACCEPT_QUEST') {
    return {
      kind: 'short',
      durationMs: 420,
      title: '',
      phases: ['pulse'],
    };
  }
  if (action.type === 'CHOOSE_CLASS_PATH' || action.type === 'REST' || action.type === 'OPEN_SHOP') {
    return {
      kind: 'short',
      durationMs: 480,
      title: action.type === 'OPEN_SHOP' ? '진열장을 연다' : '',
      phases: ['pulse'],
    };
  }

  return {
    kind: 'short',
    durationMs: 360,
    title: '',
    phases: ['pulse'],
  };
}

export function shouldStageCommand(command: Command): boolean {
  return (
    command.type === 'SELECT_CHOICE' ||
    command.type === 'MOVE_TO_LOCATION' ||
    command.type === 'START_COMBAT'
  );
}
