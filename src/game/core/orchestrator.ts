import { createActionParser } from '../../ai/action-parser/create-action-parser';
import type { ActionParser } from '../../ai/action-parser/types';
import { createNpcDialogueService } from '../../ai/service';
import type { NpcDialogueService } from '../../ai/types';
import { buildActionParserContext } from '../actions/build-parser-context';
import { resolveAction } from '../actions/action-resolver';
import { validateAction } from '../actions/action-validator';
import type { Command } from './command';
import type { GameEvent } from './event';
import type { GameState } from './game-state';
import { applyEvents } from './reducer';
import { createRulesEngine } from '../rules/create-rules-engine';
import { getTalkPrompt } from '../npc/talk-choices';
import { findLiveCandidate } from '../story/choices/choice-revalidation';
import { resolvePlayerTurnEvents } from './turn-pipeline';
import {
  AUTO_SAVE_SLOT_ID,
  createLocalSaveService,
  shouldAutosave,
  toGameState,
  type SaveService,
} from '../save';

/**
 * Accepts Commands, runs them through the Rules Engine, and applies Events.
 * React and AI must not mutate GameState themselves.
 */
export interface GameOrchestrator {
  dispatch(command: Command): Promise<void>;
  getState(): Readonly<GameState>;
}

export interface GameOrchestratorOptions {
  saveService?: SaveService;
  now?: () => number;
  actionParser?: ActionParser;
  dialogue?: NpcDialogueService;
  /** Chapter 1 play does not read or write saves. Tests leave this on. */
  autosaveEnabled?: boolean;
}

export function createGameOrchestrator(
  initialState: GameState,
  onChange?: (state: Readonly<GameState>) => void,
  options: GameOrchestratorOptions = {}
): GameOrchestrator {
  let state = initialState;
  const rules = createRulesEngine();
  const getState = () => state;
  const parser: ActionParser = options.actionParser ?? createActionParser({ getTurnId: () => state.world.turn });
  const dialogue: NpcDialogueService = options.dialogue ?? createNpcDialogueService(getState);
  const saveService = options.saveService ?? createLocalSaveService();
  const now = options.now ?? Date.now;
  let sessionStartedAt = now();
  let playTimeBase = 0;

  function currentPlayTime(): number {
    return playTimeBase + Math.max(0, Math.floor((now() - sessionStartedAt) / 1000));
  }

  function commitPlayTime() {
    playTimeBase = currentPlayTime();
    sessionStartedAt = now();
  }

  function applyState(next: GameState) {
    state = next;
    onChange?.(state);
  }

  function applyCommand(command: Command): boolean {
    const result = rules.evaluate(command, state);
    if (!result.allowed) {
      // Surface rejected story/move choices so the UI does not feel soft-locked.
      if (
        (command.type === 'SELECT_CHOICE' || command.type === 'MOVE_TO_LOCATION') &&
        result.reason
      ) {
        applyNotice(result.reason);
      }
      return false;
    }
    const events = resolvePlayerTurnEvents(state, result.events);
    applyState(applyEvents(state, events));
    maybeAutosave(events);
    return true;
  }

  function applyNotice(message: string) {
    applyState(applyEvents(state, [{ type: 'SAVE_NOTICE', message }]));
  }

  function maybeAutosave(events: readonly GameEvent[]) {
    if (options.autosaveEnabled === false || !shouldAutosave(events)) {
      return;
    }
    const playTimeSeconds = currentPlayTime();
    const result = saveService.save(AUTO_SAVE_SLOT_ID, state, playTimeSeconds);
    if (result.success) {
      commitPlayTime();
    }
  }

  function saveGame(slotId: string) {
    const result = rules.evaluate({ type: 'SAVE_GAME', slotId }, state);
    if (!result.allowed) {
      applyNotice(result.reason ?? '지금은 저장할 수 없습니다.');
      return;
    }
    const playTimeSeconds = currentPlayTime();
    const saved = saveService.save(slotId, state, playTimeSeconds);
    if (!saved.success) {
      applyNotice(saved.error ?? '저장에 실패했습니다.');
      return;
    }
    commitPlayTime();
    applyState(applyEvents(state, result.events));
  }

  function loadGame(slotId: string) {
    const result = rules.evaluate({ type: 'LOAD_GAME', slotId }, state);
    if (!result.allowed) {
      applyNotice(result.reason ?? '지금은 불러올 수 없습니다.');
      return;
    }
    const loaded = saveService.load(slotId);
    if (!loaded.success || !loaded.saveData) {
      applyNotice(loaded.error ?? '해당 저장 파일을 불러올 수 없습니다.');
      return;
    }
    playTimeBase = loaded.saveData.playTimeSeconds;
    sessionStartedAt = now();
    applyState(
      applyEvents(state, [
        {
          type: 'GAME_LOADED',
          slotId,
          gameState: toGameState(loaded.saveData.gameState),
        },
      ])
    );
  }

  function deleteSave(slotId: string) {
    const deleted = saveService.delete(slotId);
    if (!deleted.success) {
      applyNotice(deleted.error ?? '저장에 실패했습니다.');
      return;
    }
    applyCommand({ type: 'DELETE_SAVE', slotId });
  }

  function newGame(command: Extract<Command, { type: 'NEW_GAME' }>) {
    const result = rules.evaluate(command, state);
    if (!result.allowed) {
      applyNotice(result.reason ?? '지금은 새 게임을 시작할 수 없습니다.');
      return;
    }
    playTimeBase = 0;
    sessionStartedAt = now();
    applyState(applyEvents(state, result.events));
  }

  async function resolveFreeAction(command: Extract<Command, { type: 'FREE_ACTION' } | { type: 'SUBMIT_FREE_INPUT' }>) {
    const input = command.type === 'FREE_ACTION' ? command.input : command.text;
    const turnId = command.type === 'FREE_ACTION' ? command.turnId : state.world.turn;
    const started = applyCommand(
      command.type === 'FREE_ACTION' ? command : { type: 'FREE_ACTION', turnId, input }
    );
    if (!started) {
      return;
    }

    const unlock = (narrative: string, success = false) => {
      if (state.mode !== 'RESOLVING' && state.pendingFreeActionTurnId == null) {
        return;
      }
      applyState(
        applyEvents(state, [
          {
            type: 'ACTION_RESOLVED',
            turnId,
            resolution: {
              success,
              actionType: 'UNKNOWN',
              narrative,
              nextMode: 'STORY',
            },
          },
        ])
      );
    };

    try {
      const context = buildActionParserContext(state);
      const parsed = await parser.parse(input, context);
      if (state.pendingFreeActionTurnId !== turnId || state.world.turn !== turnId) {
        unlock('지금은 다른 행동이 먼저 처리되었다.');
        return;
      }

      const validation = validateAction(parsed, state);
      let dialogueResponse = null;
      if (validation.valid && (parsed.actionType === 'ASK' || parsed.actionType === 'TALK')) {
        const npcId = parsed.targetId ?? state.story.currentNpcId ?? 'seria';
        dialogueResponse = await dialogue.respond(npcId, parsed.speech ?? parsed.rawInput);
        if (state.pendingFreeActionTurnId !== turnId || state.world.turn !== turnId) {
          unlock('지금은 다른 행동이 먼저 처리되었다.');
          return;
        }
      }

      const payload = resolveAction(parsed, validation, state, dialogueResponse);
      const committed = applyCommand({
        type: 'COMMIT_FREE_ACTION',
        turnId,
        rawInput: input,
        payload,
      });
      if (!committed) {
        unlock('그 행동을 할 방법이 떠오르지 않는다.');
      }
    } catch {
      unlock('그 행동을 끝까지 해내지 못했다.');
    }
  }

  async function resolveDynamicChoice(command: Extract<Command, { type: 'SELECT_DYNAMIC_CHOICE' }>) {
    if (command.turnId !== state.world.turn) {
      return;
    }
    const result = rules.evaluate(command, state);
    if (!result.allowed) {
      if (result.reason === 'STALE_DIRECTOR_RESPONSE') {
        return;
      }
      applyState(
        applyEvents(state, [
          {
            type: 'ACTION_RESOLVED',
            turnId: command.turnId,
            resolution: {
              success: false,
              actionType: 'UNKNOWN',
              narrative: result.reason ?? '지금은 그 행동을 할 수 없다.',
              nextMode: 'STORY',
            },
          },
        ])
      );
      return;
    }

    const events = resolvePlayerTurnEvents(state, result.events);
    applyState(applyEvents(state, events));
    maybeAutosave(events);

    const startedTalk = result.events.some((event) => event.type === 'ACTION_RESOLVE_STARTED');
    if (!startedTalk) {
      return;
    }

    const npcId = state.story.currentNpcId ?? 'seria';
    const lookupState: GameState = { ...state, mode: 'STORY' };
    const candidate = findLiveCandidate(lookupState, command.candidateId);
    const prompt =
      getTalkPrompt(candidate?.metadata?.promptId ?? '') ?? candidate?.textTemplate ?? command.choiceId;
    try {
      const response = await dialogue.respond(npcId, prompt);
      if (state.pendingFreeActionTurnId !== command.turnId || state.world.turn !== command.turnId) {
        if (state.mode === 'RESOLVING' || state.pendingFreeActionTurnId != null) {
          applyState(
            applyEvents(state, [
              {
                type: 'ACTION_RESOLVED',
                turnId: command.turnId,
                resolution: {
                  success: false,
                  actionType: 'TALK',
                  narrative: '지금은 다른 이야기가 먼저 진행되었다.',
                  nextMode: 'STORY',
                },
              },
            ])
          );
        }
        return;
      }
      applyCommand({
        type: 'RECORD_DIALOGUE',
        npcId: response.npcId,
        playerText: prompt,
        npcText: response.dialogue,
        usedMemoryIds: response.usedMemoryIds,
      });
    } catch {
      applyCommand({
        type: 'RECORD_DIALOGUE',
        npcId,
        playerText: prompt,
        npcText: '……지금은 말을 고르지 못한다.',
        usedMemoryIds: [],
      });
    }
    if (state.mode === 'RESOLVING' || state.pendingFreeActionTurnId != null) {
      applyState(
        applyEvents(state, [
          {
            type: 'ACTION_RESOLVED',
            turnId: command.turnId,
            resolution: {
              success: true,
              actionType: candidate?.actionType ?? 'TALK',
              narrative: state.story.lastActionNarrative ?? prompt,
              nextMode: 'STORY',
            },
          },
        ])
      );
    }
  }

  return {
    async dispatch(command: Command) {
      if (command.type === 'FREE_ACTION' || command.type === 'SUBMIT_FREE_INPUT') {
        await resolveFreeAction(command);
        return;
      }
      if (command.type === 'SELECT_DYNAMIC_CHOICE') {
        await resolveDynamicChoice(command);
        return;
      }
      if (command.type === 'SAVE_GAME') {
        saveGame(command.slotId);
        return;
      }
      if (command.type === 'LOAD_GAME') {
        loadGame(command.slotId);
        return;
      }
      if (command.type === 'DELETE_SAVE') {
        deleteSave(command.slotId);
        return;
      }
      if (command.type === 'NEW_GAME') {
        newGame(command);
        return;
      }
      applyCommand(command);
    },
    getState,
  };
}
