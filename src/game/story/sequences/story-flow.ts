import type { GameState } from '../../core/game-state';
import { isAdventureSequenceId } from '../game-phase';
import {
  findSequenceForScene,
  findSequenceStartedBy,
  getSequenceDefinition,
  isHubRoamScene,
  isSequenceCompleteScene,
} from './chapter1-sequences';
import {
  MAX_STORY_LOG_ENTRIES,
  STORY_FLOW_MODE,
  type PlayMode,
  type StoryFlowMode,
  type StoryLogEntry,
} from './story-sequence-types';

export function getStoryFlowMode(state: Readonly<GameState>): StoryFlowMode {
  return state.story.flowMode === STORY_FLOW_MODE.STORY_LOCKED
    ? STORY_FLOW_MODE.STORY_LOCKED
    : STORY_FLOW_MODE.FREE_ROAM;
}

export function getPlayMode(state: Readonly<GameState>): PlayMode {
  if (state.mode === 'COMBAT' || state.activeCombatId !== null) {
    return 'COMBAT';
  }
  return getStoryFlowMode(state);
}

export function isStoryLocked(state: Readonly<GameState>): boolean {
  return getPlayMode(state) === STORY_FLOW_MODE.STORY_LOCKED;
}

/**
 * Village free travel / hub menus.
 * Adventure sequences lock field travel; other story-locked village beats (arrival, talks)
 * still allow hub↔hub movement so the player cannot soft-lock themselves.
 */
export function canUseFreeTravel(state: Readonly<GameState>): boolean {
  if (state.mode === 'COMBAT' || state.activeCombatId !== null) {
    return false;
  }
  if (isAdventureSequenceId(state.story.currentSequenceId)) {
    return false;
  }
  // Arrival / town sequences stay STORY_LOCKED but must not block hub travel.
  if (getStoryFlowMode(state) === STORY_FLOW_MODE.STORY_LOCKED) {
    return true;
  }
  return getStoryFlowMode(state) === STORY_FLOW_MODE.FREE_ROAM;
}

export function canOpenSideContent(state: Readonly<GameState>): boolean {
  return canUseFreeTravel(state);
}

export interface StoryFlowUpdate {
  flowMode: StoryFlowMode;
  currentSequenceId: string | null;
  completedSequenceIds: readonly string[];
  logEntries: readonly StoryLogEntry[];
}

let logSeq = 0;

export function nextLogId(prefix: string): string {
  logSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${logSeq}`;
}

export function appendStoryLog(
  existing: readonly StoryLogEntry[] | undefined,
  entries: readonly StoryLogEntry[]
): StoryLogEntry[] {
  if (entries.length === 0) {
    return [...(existing ?? [])];
  }
  const merged = [...(existing ?? []), ...entries];
  if (merged.length <= MAX_STORY_LOG_ENTRIES) {
    return merged;
  }
  return merged.slice(merged.length - MAX_STORY_LOG_ENTRIES);
}

export function narrationLogEntry(text: string, sceneId?: string): StoryLogEntry {
  return { type: 'narration', text, sceneId, id: nextLogId('nar') };
}

export function dialogueLogEntry(speaker: string, text: string): StoryLogEntry {
  return { type: 'dialogue', speaker, text, id: nextLogId('dlg') };
}

export function choiceLogEntry(text: string): StoryLogEntry {
  return { type: 'choice', text, id: nextLogId('ch') };
}

export function systemLogEntry(text: string): StoryLogEntry {
  return { type: 'system', text, id: nextLogId('sys') };
}

/**
 * Derive next flow mode / sequence when entering a scene.
 * Combat does not clear STORY_LOCKED — caller keeps flow fields across COMBAT.
 * Adventure sequences stay locked until ADVENTURE_ENDED (not hub roam scenes).
 */
export function resolveStoryFlowOnSceneEnter(
  state: Readonly<GameState>,
  sceneId: string,
  options: { alreadyCurrent?: boolean; narrative?: string } = {}
): StoryFlowUpdate {
  const completed = [...(state.story.completedSequenceIds ?? [])];
  let flowMode = getStoryFlowMode(state);
  let currentSequenceId = state.story.currentSequenceId ?? null;
  const logEntries: StoryLogEntry[] = [];

  const starter = findSequenceStartedBy(sceneId);
  const belonging = findSequenceForScene(sceneId);
  const active = getSequenceDefinition(currentSequenceId);

  // Active adventure: stay locked until explicit ADVENTURE_ENDED.
  if (isAdventureSequenceId(currentSequenceId) && !completed.includes(currentSequenceId!)) {
    flowMode = STORY_FLOW_MODE.STORY_LOCKED;
    if (!options.alreadyCurrent && options.narrative?.trim()) {
      const last = state.story.storyLog?.[state.story.storyLog.length - 1];
      const duplicate =
        last?.type === 'narration' && last.text === options.narrative && last.sceneId === sceneId;
      if (!duplicate) {
        logEntries.push(narrationLogEntry(options.narrative, sceneId));
      }
    }
    return {
      flowMode,
      currentSequenceId,
      completedSequenceIds: completed,
      logEntries,
    };
  }

  if (starter && !completed.includes(starter.id)) {
    if (currentSequenceId !== starter.id) {
      currentSequenceId = starter.id;
      flowMode = isAdventureSequenceId(starter.id)
        ? STORY_FLOW_MODE.STORY_LOCKED
        : STORY_FLOW_MODE.STORY_LOCKED;
      if (!options.alreadyCurrent) {
        logEntries.push(systemLogEntry(`— ${starter.title} —`));
      }
    } else {
      flowMode = STORY_FLOW_MODE.STORY_LOCKED;
    }
  } else if (active && active.sceneIds.includes(sceneId)) {
    flowMode = STORY_FLOW_MODE.STORY_LOCKED;
    if (isSequenceCompleteScene(active, sceneId) && !isAdventureSequenceId(active.id)) {
      if (!completed.includes(active.id)) {
        completed.push(active.id);
      }
      currentSequenceId = null;
      flowMode = STORY_FLOW_MODE.FREE_ROAM;
      if (!options.alreadyCurrent) {
        logEntries.push(systemLogEntry(`${active.title}이(가) 끝났다.`));
      }
    }
  } else if (belonging && !completed.includes(belonging.id) && belonging.sceneIds.includes(sceneId)) {
    currentSequenceId = belonging.id;
    flowMode = STORY_FLOW_MODE.STORY_LOCKED;
  } else if (isHubRoamScene(sceneId)) {
    currentSequenceId = active && !completed.includes(active.id) && isAdventureSequenceId(active.id)
      ? currentSequenceId
      : null;
    if (!isAdventureSequenceId(currentSequenceId)) {
      flowMode = STORY_FLOW_MODE.FREE_ROAM;
      currentSequenceId = null;
    }
  }

  if (!options.alreadyCurrent && options.narrative?.trim()) {
    const last = state.story.storyLog?.[state.story.storyLog.length - 1];
    const duplicate =
      last?.type === 'narration' && last.text === options.narrative && last.sceneId === sceneId;
    if (!duplicate) {
      logEntries.push(narrationLogEntry(options.narrative, sceneId));
    }
  }

  return {
    flowMode,
    currentSequenceId,
    completedSequenceIds: completed,
    logEntries,
  };
}

export function defaultStoryFlowFields(): {
  flowMode: StoryFlowMode;
  currentSequenceId: string | null;
  completedSequenceIds: readonly string[];
  storyLog: readonly StoryLogEntry[];
} {
  return {
    flowMode: STORY_FLOW_MODE.FREE_ROAM,
    currentSequenceId: null,
    completedSequenceIds: [],
    storyLog: [],
  };
}
