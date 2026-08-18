import type { GameEvent } from './event';
import type { GameState } from './game-state';
import { createInitialGameState } from './initial-state';
import { clampRelationship, createRelationship } from '../npc/relationship';
import { trimNpcMemories } from '../npc/memory/memory-service';
import { withItemAdded, withItemConsumed, withItemRemoved } from '../player/player-state';
import { clampResourceToDerived, derivedPlayerStats } from '../inventory/derived-stats';
import { emptyEquipment, slotKey } from '../inventory/equipment-types';
import { getItemDefinition, type EquipmentSlot } from '../inventory/item-definitions';
import type { EconomyNotice } from './game-state';
import { applyPlayerClass } from '../player/classes';
import { withHistoryEntry } from '../history/history-rules';
import { expRequiredForLevel } from '../player/progression/level-config';
import { dayFromTotalMinutes, formatClock } from '../time/clock-types';
import { displayClassName } from '../player/classes';
import { isNpcDuelCombatId } from '../actions/action-validator';
import { getQuestDefinition } from '../quests/quest-definitions';
import { createQuestRuntime } from '../quests/quest-runtime';
import { emptyProgress } from '../quests/quest-selectors';
import { storyChoicesForState } from '../quests/quest-story-choices';
import { QUEST_STATUS, type QuestState } from '../quests/quest-types';
import { createLocationRuntime } from '../world/locations/location-runtime';
import { getLocationDescription } from '../world/locations/location-selectors';
import type { LocationRuntimeState } from '../world/locations/location-types';
import { withEnteredStoryScene, sanitizeStoryState } from '../story/story-runtime';
import {
  SCENE_GOBLIN_DEFEAT,
  SCENE_GOBLIN_INTRO,
  SCENE_GOBLIN_VICTORY,
  SCENE_REST,
  SCENE_RUINS_SEARCH,
  SCENE_SERIA_RETURN,
  TEST_GOBLIN_COMBAT_ID,
} from '../story/test-scenes';
import { MAX_DIALOGUE_MESSAGES } from '../story/story-state';
import type { SceneId } from './ids';

function withStoryScene(state: GameState, sceneId: SceneId): GameState {
  return withEnteredStoryScene(state, sceneId);
}

function withDialogue(state: GameState, speaker: 'PLAYER' | 'NPC', text: string, npcId?: string): GameState {
  const dialogue = [...state.story.dialogue, { speaker, text }].slice(-MAX_DIALOGUE_MESSAGES);
  return {
    ...state,
    story: {
      ...state.story,
      currentNpcId: npcId ?? state.story.currentNpcId,
      dialogue,
    },
  };
}

function withQuestAwareChoices(state: GameState): GameState {
  return {
    ...state,
    story: {
      ...state.story,
      choices: storyChoicesForState(state),
    },
  };
}

function withQuest(state: GameState, quest: QuestState): GameState {
  return withQuestAwareChoices({
    ...state,
    quests: {
      ...state.quests,
      [quest.id]: quest,
    },
  });
}

function questOrCreate(state: GameState, questId: string): QuestState | null {
  return state.quests[questId] ?? createQuestRuntime(questId);
}

function presentNpcId(state: GameState, locationId: string, preferred?: string | null): string | null {
  const present = Object.values(state.npcs).filter((npc) => npc.locationId === locationId);
  if (preferred && present.some((npc) => npc.id === preferred)) {
    return preferred;
  }
  return present[0]?.id ?? preferred ?? null;
}

function withLocationNarration(state: GameState): GameState {
  const locationId = state.world.currentLocationId;
  return withQuestAwareChoices({
    ...state,
    story: {
      ...state.story,
      currentNpcId: presentNpcId(state, locationId, state.story.currentNpcId),
      narration: getLocationDescription(locationId, state),
    },
  });
}

function withLocationEntered(state: GameState, locationId: string): GameState {
  const changed = locationId !== state.world.currentLocationId;
  if (!changed) {
    return withLocationNarration(state);
  }
  const previous = state.world.locations[locationId] ?? createLocationRuntime(locationId);
  const turn = state.world.turn + 1;
  const runtime: LocationRuntimeState = {
    ...previous,
    discovered: true,
    visited: true,
    visitCount: previous.visitCount + 1,
    firstVisitedAtTurn: previous.firstVisitedAtTurn ?? turn,
    lastVisitedAtTurn: turn,
  };
  const next: GameState = {
    ...state,
    player: {
      ...state.player,
      locationId,
    },
    world: {
      ...state.world,
      currentLocationId: locationId,
      turn,
      locations: {
        ...state.world.locations,
        [locationId]: runtime,
      },
    },
  };
  return withLocationNarration(next);
}

function withEconomyNotice(state: GameState, notice: EconomyNotice): GameState {
  return { ...state, lastEconomyNotice: notice };
}

function withRewardId(state: GameState, sourceEventId: string): GameState {
  if ((state.processedRewardIds ?? []).includes(sourceEventId)) {
    return state;
  }
  return {
    ...state,
    processedRewardIds: [...(state.processedRewardIds ?? []), sourceEventId],
  };
}

function withClampedResources(state: GameState): GameState {
  const clamped = clampResourceToDerived(state.player);
  if (clamped.currentHp === state.player.currentHp && clamped.currentMp === state.player.currentMp) {
    return state;
  }
  return {
    ...state,
    player: {
      ...state.player,
      currentHp: clamped.currentHp,
      currentMp: clamped.currentMp,
    },
  };
}

function applyEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'COMBAT_STARTED':
      return {
        ...state,
        mode: 'COMBAT',
        activeCombatId: event.combatId,
      };
    case 'PLAYER_COMBAT_HP_UPDATED': {
      const maxHp = derivedPlayerStats(state.player).maxHp;
      return {
        ...state,
        player: {
          ...state.player,
          currentHp: Math.max(0, Math.min(maxHp, event.currentHp)),
        },
      };
    }
    case 'PLAYER_COMBAT_MP_UPDATED': {
      const maxMp = derivedPlayerStats(state.player).maxMp;
      return {
        ...state,
        player: {
          ...state.player,
          currentMp: Math.max(0, Math.min(maxMp, event.currentMp)),
        },
      };
    }
    case 'COMBAT_WON':
      return finishCombat(state, event.combatId, 'won');
    case 'COMBAT_LOST':
      return finishCombat(state, event.combatId, 'lost');
    case 'STORY_UPDATED':
      return withStoryScene({ ...state, mode: 'STORY' }, event.sceneId);
    case 'STORY_SCENE_ENTERED':
      if (state.mode === 'COMBAT') {
        return state;
      }
      if (state.story.currentSceneId === event.sceneId) {
        return withEnteredStoryScene({ ...state, mode: 'STORY' }, event.sceneId, { countVisit: false });
      }
      return withEnteredStoryScene({ ...state, mode: 'STORY' }, event.sceneId);
    case 'CHOICE_RESOLVED':
    case 'FREE_INPUT_RESOLVED':
    case 'ENEMY_DEFEATED':
    case 'PLAYER_DEFEATED':
    case 'DIALOGUE_ENDED':
      return {
        ...state,
        mode: 'STORY',
        story: {
          ...state.story,
          currentNpcId: null,
        },
      };
    case 'NPC_RECEIVED_GOLD':
    case 'AREA_INVESTIGATED':
    case 'LOCATION_LEFT':
      return state;
    case 'LOCATION_ENTERED':
      return withLocationEntered(state, event.locationId);
    case 'LOCATION_DISCOVERED': {
      const previous = state.world.locations[event.locationId] ?? createLocationRuntime(event.locationId);
      if (previous.discovered) {
        return state;
      }
      return {
        ...state,
        world: {
          ...state.world,
          locations: {
            ...state.world.locations,
            [event.locationId]: {
              ...previous,
              discovered: true,
            },
          },
        },
      };
    }
    case 'NPC_MOVED': {
      const npc = state.npcs[event.npcId];
      if (!npc || npc.locationId === event.toLocationId) {
        return state;
      }
      const next: GameState = {
        ...state,
        npcs: {
          ...state.npcs,
          [event.npcId]: {
            ...npc,
            locationId: event.toLocationId,
          },
        },
      };
      return withLocationNarration(next);
    }
    case 'WORLD_FLAG_SET': {
      if (state.world.flags[event.flagId] === event.value) {
        return state;
      }
      const next: GameState = {
        ...state,
        world: {
          ...state.world,
          flags: {
            ...state.world.flags,
            [event.flagId]: event.value,
          },
        },
      };
      return withLocationNarration(next);
    }
    case 'EXPLORATION_POINT_COMPLETED': {
      if (state.world.exploredPointIds.includes(event.pointId)) {
        return state;
      }
      return {
        ...state,
        world: {
          ...state.world,
          exploredPointIds: [...state.world.exploredPointIds, event.pointId],
        },
      };
    }
    case 'ACTION_RESOLVE_STARTED':
      return {
        ...state,
        mode: 'RESOLVING',
        pendingFreeActionTurnId: event.turnId,
      };
    case 'ACTION_RESOLVED':
      return {
        ...state,
        mode: event.resolution.nextMode === 'COMBAT' ? state.mode : event.resolution.nextMode ?? 'STORY',
        pendingFreeActionTurnId: null,
        lastActionResolution: event.resolution,
        story: {
          ...state.story,
          lastActionNarrative: event.resolution.narrative,
        },
      };
    case 'PLAYER_LINE_RECORDED':
      return withDialogue(state, 'PLAYER', event.text);
    case 'GOLD_SPENT':
      return {
        ...state,
        player: {
          ...state.player,
          gold: Math.max(0, state.player.gold - event.amount),
        },
      };
    case 'ITEM_RECEIVED':
      return {
        ...state,
        player: {
          ...state.player,
          inventory: withItemAdded(state.player.inventory, event.itemId, event.quantity ?? 1),
        },
      };
    case 'ITEM_OBTAINED': {
      if ((state.processedRewardIds ?? []).includes(event.sourceEventId)) {
        return state;
      }
      const definition = getItemDefinition(event.itemId);
      if (!definition) {
        return withRewardId(state, event.sourceEventId);
      }
      return withEconomyNotice(
        withRewardId(
          {
            ...state,
            player: {
              ...state.player,
              inventory: withItemAdded(state.player.inventory, event.itemId, event.quantity),
            },
          },
          event.sourceEventId
        ),
        {
          id: event.sourceEventId,
          title: `${definition.name} x${event.quantity} 획득`,
        }
      );
    }
    case 'ITEM_PURCHASED': {
      if ((state.processedRewardIds ?? []).includes(event.sourceEventId)) {
        return state;
      }
      const definition = getItemDefinition(event.itemId);
      return withEconomyNotice(
        withRewardId(
          {
            ...state,
            player: {
              ...state.player,
              inventory: withItemAdded(state.player.inventory, event.itemId, event.quantity),
            },
          },
          event.sourceEventId
        ),
        {
          id: event.sourceEventId,
          title: definition ? `${definition.name} 구매` : '구매',
          detail: `-${event.price} G`,
        }
      );
    }
    case 'ITEM_SOLD': {
      if ((state.processedRewardIds ?? []).includes(event.sourceEventId)) {
        return state;
      }
      return withRewardId(
        {
          ...state,
          player: {
            ...state.player,
            inventory: withItemRemoved(state.player.inventory, event.itemId, event.quantity),
          },
        },
        event.sourceEventId
      );
    }
    case 'ITEM_EQUIPPED': {
      const equipment = { ...(state.player.equipment ?? emptyEquipment()) };
      equipment[slotKey(event.slot as EquipmentSlot)] = event.itemId;
      const definition = getItemDefinition(event.itemId);
      return withClampedResources(
        withEconomyNotice(
          {
            ...state,
            player: {
              ...state.player,
              inventory: withItemRemoved(state.player.inventory, event.itemId, 1),
              equipment,
            },
          },
          { id: `equip:${event.itemId}:${state.world.turn}`, title: definition ? `${definition.name} 장착` : '장착' }
        )
      );
    }
    case 'ITEM_UNEQUIPPED': {
      const equipment = { ...(state.player.equipment ?? emptyEquipment()) };
      equipment[slotKey(event.slot as EquipmentSlot)] = null;
      return withClampedResources({
        ...state,
        player: {
          ...state.player,
          inventory: withItemAdded(state.player.inventory, event.itemId, 1),
          equipment,
        },
      });
    }
    case 'PLAYER_GOLD_GAINED': {
      if ((state.processedRewardIds ?? []).includes(event.sourceEventId)) {
        return state;
      }
      return withEconomyNotice(
        withRewardId(
          {
            ...state,
            player: {
              ...state.player,
              gold: state.player.gold + Math.max(0, event.amount),
            },
          },
          event.sourceEventId
        ),
        { id: event.sourceEventId, title: `+${event.amount} G` }
      );
    }
    case 'PLAYER_GOLD_SPENT': {
      if ((state.processedRewardIds ?? []).includes(event.sourceEventId)) {
        return state;
      }
      return withEconomyNotice(
        withRewardId(
          {
            ...state,
            player: {
              ...state.player,
              gold: Math.max(0, state.player.gold - Math.max(0, event.amount)),
            },
          },
          event.sourceEventId
        ),
        { id: event.sourceEventId, title: `-${event.amount} G` }
      );
    }
    case 'PLAYER_GOLD_UPDATED':
      return {
        ...state,
        player: {
          ...state.player,
          gold: Math.max(0, event.gold),
        },
      };
    case 'PLAYER_CLASS_UPDATED':
      return {
        ...state,
        player: applyPlayerClass(state.player, event.classId),
      };
    case 'DIALOGUE_STARTED':
      return {
        ...state,
        story: {
          ...state.story,
          currentNpcId: event.npcId,
          dialogue: [],
        },
      };
    case 'DIALOGUE_TURN_RECORDED': {
      const dialogue = [
        ...state.story.dialogue,
        { speaker: 'PLAYER' as const, text: event.playerText },
        { speaker: 'NPC' as const, text: event.npcText },
      ].slice(-MAX_DIALOGUE_MESSAGES);
      return {
        ...state,
        story: {
          ...state.story,
          currentNpcId: event.npcId,
          dialogue,
        },
      };
    }
    case 'RELATIONSHIP_UPDATED': {
      const current = state.relationships[event.npcId] ?? createRelationship();
      return {
        ...state,
        relationships: {
          ...state.relationships,
          [event.npcId]: clampRelationship({
            affection: event.affection ?? current.affection,
            trust: event.trust ?? current.trust,
            fear: event.fear ?? current.fear,
            respect: event.respect ?? current.respect,
          }),
        },
      };
    }
    case 'NPC_RELATIONSHIP_CHANGED': {
      if (state.processedRelationshipSourceIds.includes(event.sourceEventId)) {
        return state;
      }
      const current = state.relationships[event.npcId] ?? createRelationship();
      const npcName = state.npcs[event.npcId]?.name ?? event.npcId;
      const feedbackParts = [
        event.delta.affection ? `호감 ${event.delta.affection > 0 ? '+' : ''}${event.delta.affection}` : '',
        event.delta.trust ? `신뢰 ${event.delta.trust > 0 ? '+' : ''}${event.delta.trust}` : '',
        event.delta.fear ? `두려움 ${event.delta.fear > 0 ? '+' : ''}${event.delta.fear}` : '',
        event.delta.respect ? `존경 ${event.delta.respect > 0 ? '+' : ''}${event.delta.respect}` : '',
      ].filter(Boolean);
      const feedback = feedbackParts.length > 0 ? `${npcName} ${feedbackParts.join(' · ')}` : null;
      return {
        ...state,
        processedRelationshipSourceIds: [...state.processedRelationshipSourceIds, event.sourceEventId],
        relationships: {
          ...state.relationships,
          [event.npcId]: clampRelationship({
            affection: current.affection + event.delta.affection,
            trust: current.trust + event.delta.trust,
            fear: current.fear + event.delta.fear,
            respect: current.respect + event.delta.respect,
          }),
        },
        story: {
          ...state.story,
          lastActionNarrative: [state.story.lastActionNarrative, feedback].filter(Boolean).join(' / '),
        },
      };
    }
    case 'QUEST_UPDATED': {
      const quest = questOrCreate(state, event.questId);
      if (!quest) {
        return state;
      }
      return withQuest(state, {
        ...quest,
        status: event.status ?? quest.status,
      });
    }
    case 'QUEST_AVAILABLE': {
      const quest = questOrCreate(state, event.questId);
      if (!quest || quest.status === QUEST_STATUS.ACTIVE || quest.status === QUEST_STATUS.COMPLETED) {
        return state;
      }
      if (quest.status === QUEST_STATUS.AVAILABLE) {
        return state;
      }
      return withQuest(state, { ...quest, status: QUEST_STATUS.AVAILABLE });
    }
    case 'QUEST_STARTED': {
      const quest = questOrCreate(state, event.questId);
      if (!quest || quest.status === QUEST_STATUS.ACTIVE || quest.status === QUEST_STATUS.COMPLETED) {
        return state;
      }
      const definition = getQuestDefinition(event.questId);
      return withQuest(state, {
        ...quest,
        status: QUEST_STATUS.ACTIVE,
        startedAtTurn: quest.startedAtTurn ?? state.world.turn,
        objectiveProgress:
          Object.keys(quest.objectiveProgress).length > 0
            ? quest.objectiveProgress
            : emptyProgress(definition?.objectives ?? []),
      });
    }
    case 'QUEST_OBJECTIVE_PROGRESS':
    case 'QUEST_OBJECTIVE_COMPLETED': {
      const quest = state.quests[event.questId];
      if (!quest) {
        return state;
      }
      const previous = quest.objectiveProgress[event.objectiveId];
      const completed = event.type === 'QUEST_OBJECTIVE_COMPLETED' ? true : event.completed;
      if (previous?.completed && completed) {
        return state;
      }
      return withQuest(state, {
        ...quest,
        objectiveProgress: {
          ...quest.objectiveProgress,
          [event.objectiveId]: {
            objectiveId: event.objectiveId,
            currentCount: event.type === 'QUEST_OBJECTIVE_PROGRESS' ? event.currentCount : Math.max(previous?.currentCount ?? 0, 1),
            completed,
            countedIds: previous?.countedIds ?? [],
          },
        },
      });
    }
    case 'QUEST_COMPLETED': {
      const quest = state.quests[event.questId];
      if (!quest || quest.status === QUEST_STATUS.COMPLETED) {
        return state;
      }
      return withQuest(state, {
        ...quest,
        status: QUEST_STATUS.COMPLETED,
        completedAtTurn: quest.completedAtTurn ?? state.world.turn,
      });
    }
    case 'QUEST_FAILED': {
      const quest = state.quests[event.questId];
      if (!quest || quest.status === QUEST_STATUS.COMPLETED || quest.status === QUEST_STATUS.FAILED) {
        return state;
      }
      return withQuest(state, { ...quest, status: QUEST_STATUS.FAILED });
    }
    case 'COMBAT_ENDED':
      return {
        ...state,
        world: {
          ...state.world,
          turn: state.world.turn + 1,
        },
      };
    case 'WORLD_FACT_RECORDED':
      if (state.world.facts.some((fact) => fact.id === event.fact.id)) {
        return state;
      }
      return {
        ...state,
        world: {
          ...state.world,
          facts: [...state.world.facts, event.fact],
        },
      };
    case 'PLAYER_LEARNED_FACT':
      if (state.knowledge.knownFactIds.includes(event.factId)) {
        return state;
      }
      return {
        ...state,
        knowledge: {
          knownFactIds: [...state.knowledge.knownFactIds, event.factId],
        },
      };
    case 'NPC_LEARNED_FACT': {
      const npc = state.npcs[event.npcId];
      if (!npc || npc.knowledge.entries.some((entry) => entry.factId === event.entry.factId)) {
        return state;
      }
      return {
        ...state,
        npcs: {
          ...state.npcs,
          [event.npcId]: {
            ...npc,
            knowledge: {
              ...npc.knowledge,
              entries: [...npc.knowledge.entries, event.entry],
            },
          },
        },
      };
    }
    case 'NPC_MEMORY_CREATED': {
      const sourceEventId = event.memory.sourceEventId;
      if (sourceEventId && state.processedMemorySourceIds.includes(sourceEventId)) {
        return state;
      }
      const current = state.npcMemories[event.memory.npcId] ?? [];
      if (current.some((memory) => memory.id === event.memory.id || memory.sourceEventId === sourceEventId)) {
        return state;
      }
      return {
        ...state,
        processedMemorySourceIds: sourceEventId
          ? [...state.processedMemorySourceIds, sourceEventId]
          : state.processedMemorySourceIds,
        npcMemories: {
          ...state.npcMemories,
          [event.memory.npcId]: trimNpcMemories([...current, event.memory], state.world.turn),
        },
      };
    }
    case 'NPC_MEMORY_RECALLED': {
      const current = state.npcMemories[event.npcId] ?? [];
      if (current.length === 0) {
        return state;
      }
      return {
        ...state,
        npcMemories: {
          ...state.npcMemories,
          [event.npcId]: current.map((memory) =>
            event.memoryIds.includes(memory.id) ? { ...memory, lastRecalledAtTurn: event.turn } : memory
          ),
        },
      };
    }
    case 'MENU_OPENED':
      return {
        ...state,
        activeMenu: event.menu,
      };
    case 'MENU_CLOSED':
      return {
        ...state,
        activeMenu: null,
      };
    case 'SAVE_NOTICE':
      return {
        ...state,
        saveNotice: event.message,
      };
    case 'GAME_SAVED':
      return {
        ...state,
        saveNotice: event.slotId === 'autosave' ? state.saveNotice : '저장했습니다.',
      };
    case 'GAME_LOADED':
      return sanitizeStoryState({
        ...event.gameState,
        mode: event.gameState.mode === 'COMBAT' || event.gameState.mode === 'RESOLVING' ? 'STORY' : event.gameState.mode,
        activeCombatId: null,
        pendingFreeActionTurnId: null,
        activeMenu: null,
        saveNotice: '불러왔습니다.',
      });
    case 'GAME_STARTED':
      return {
        ...createInitialGameState({ name: event.name }),
        saveNotice: '새 게임을 시작합니다.',
      };
    case 'TIME_ADVANCED': {
      if ((state.processedTurnRewardIds ?? []).includes(`time:${event.sourceActionId}`)) {
        return state;
      }
      return {
        ...state,
        processedTurnRewardIds: [...(state.processedTurnRewardIds ?? []), `time:${event.sourceActionId}`],
        world: {
          ...state.world,
          totalMinutes: event.newTotalMinutes,
          day: dayFromTotalMinutes(event.newTotalMinutes),
        },
      };
    }
    case 'TURN_REWARDS_APPLIED':
      return {
        ...state,
        lastTurnSummary: { minutes: event.minutes, exp: event.exp, sourceActionId: event.sourceActionId },
      };
    case 'ACTION_REPEAT_COUNTED':
      return {
        ...state,
        actionRepeatCounts: {
          ...(state.actionRepeatCounts ?? {}),
          [event.key]: (state.actionRepeatCounts?.[event.key] ?? 0) + 1,
        },
      };
    case 'PLAYER_CLASS_PATH_CHOSEN':
      return {
        ...state,
        history: withHistoryEntry(state.history, {
          id: `history_job_${event.classId}_${state.world.turn}`,
          day: state.world.day ?? 1,
          totalMinutes: state.world.totalMinutes,
          clock: formatClock(state.world.totalMinutes ?? 0),
          locationId: state.world.currentLocationId,
          summary: `${displayClassName(event.classId)}의 길을 선택했다.`,
          kind: 'JOB',
        }),
      };
    case 'DAY_ADVANCED':
      return {
        ...state,
        world: {
          ...state.world,
          day: event.toDay,
        },
      };
    case 'PLAYER_RESTORED': {
      const derived = derivedPlayerStats(state.player);
      return {
        ...state,
        player: {
          ...state.player,
          currentHp: Math.max(0, Math.min(derived.maxHp, event.currentHp)),
          currentMp: Math.max(0, Math.min(derived.maxMp, event.currentMp)),
        },
      };
    }
    case 'PLAYER_EXP_GAINED': {
      if ((state.processedExpSourceIds ?? []).includes(event.sourceEventId)) {
        return state;
      }
      return {
        ...state,
        processedExpSourceIds: [...(state.processedExpSourceIds ?? []), event.sourceEventId],
        player: {
          ...state.player,
          exp: (state.player.exp ?? 0) + event.amount,
        },
      };
    }
    case 'PLAYER_LEVEL_UP': {
      const needed = expRequiredForLevel(event.fromLevel);
      return {
        ...state,
        player: {
          ...state.player,
          level: event.toLevel,
          exp: Math.max(0, (state.player.exp ?? 0) - needed),
          maxHp: state.player.maxHp + event.hpDelta,
          currentHp: state.player.currentHp + event.hpDelta,
          maxMp: state.player.maxMp + event.mpDelta,
          currentMp: state.player.currentMp + event.mpDelta,
          attackPower: (state.player.attackPower ?? 10) + event.attackDelta,
        },
      };
    }
    case 'CHAPTER_STARTED':
      return {
        ...state,
        story: {
          ...state.story,
          currentChapterId: event.chapterId,
        },
      };
    case 'CHAPTER_COMPLETED': {
      const completed = state.story.completedChapterIds ?? [];
      if (completed.includes(event.chapterId)) {
        return state;
      }
      return {
        ...state,
        story: {
          ...state.story,
          completedChapterIds: [...completed, event.chapterId],
        },
      };
    }
    case 'HISTORY_RECORDED':
      return {
        ...state,
        history: withHistoryEntry(state.history, {
          ...event.entry,
          day: event.entry.day || (state.world.day ?? 1),
          totalMinutes: event.entry.totalMinutes ?? state.world.totalMinutes,
          clock: event.entry.clock ?? formatClock(state.world.totalMinutes ?? 0),
        }),
      };
    case 'ITEM_CONSUMED':
      return {
        ...state,
        player: {
          ...state.player,
          inventory: withItemConsumed(state.player.inventory, event.itemId),
        },
      };
    case 'EQUIPMENT_ENHANCED': {
      const nextLevel = Math.max(event.toLevel, (state.player.equipmentEnhancements ?? {})[event.itemId] ?? 0);
      const definition = getItemDefinition(event.itemId);
      return withClampedResources(
        withEconomyNotice(
          {
            ...state,
            player: {
              ...state.player,
              equipmentEnhancements: {
                ...(state.player.equipmentEnhancements ?? {}),
                [event.itemId]: nextLevel,
              },
            },
          },
          { id: `enhance:${event.itemId}:${event.toLevel}`, title: definition ? `${definition.name} +${event.toLevel}` : '강화' }
        )
      );
    }
    case 'ENCOUNTER_CLEARED': {
      const current = state.world.clearedEncounterIds ?? [];
      if (current.includes(event.encounterId)) {
        return state;
      }
      return {
        ...state,
        world: {
          ...state.world,
          clearedEncounterIds: [...current, event.encounterId],
        },
      };
    }
    case 'DIALOGUE_TOPIC_CONSUMED': {
      const current = state.story.consumedTopicIds ?? [];
      if (current.includes(event.topicId)) {
        return state;
      }
      return {
        ...state,
        story: {
          ...state.story,
          consumedTopicIds: [...current, event.topicId],
        },
      };
    }
    case 'SEMANTIC_ACTION_RECORDED': {
      const recent = [...(state.story.recentSemanticKeys ?? []).filter((item) => item !== event.semanticKey), event.semanticKey].slice(-8);
      return {
        ...state,
        story: {
          ...state.story,
          recentSemanticKeys: recent,
          lastActionStateHash: event.stateHash ?? state.story.lastActionStateHash,
        },
      };
    }
    default:
      return state;
  }
}

function finishCombat(state: GameState, combatId: string, outcome: 'won' | 'lost'): GameState {
  const next: GameState = {
    ...state,
    mode: 'STORY',
    activeCombatId: null,
  };
  if (combatId === TEST_GOBLIN_COMBAT_ID) {
    return withStoryScene(next, outcome === 'won' ? SCENE_GOBLIN_VICTORY : SCENE_GOBLIN_DEFEAT);
  }
  if (isNpcDuelCombatId(combatId)) {
    return {
      ...next,
      story: {
        ...state.story,
        lastActionNarrative: outcome === 'won' ? '전투가 끝났다.' : '전투에서 밀려났다.',
      },
    };
  }
  return next;
}

export function applyEvents(state: GameState, events: readonly GameEvent[]): GameState {
  return events.reduce(applyEvent, state);
}

export function sceneIdForAftermathChoice(choiceId: string): SceneId {
  if (choiceId === 'search_area') {
    return SCENE_RUINS_SEARCH;
  }
  if (choiceId === 'rest_awhile') {
    return SCENE_REST;
  }
  if (choiceId === 'return_to_seria') {
    return SCENE_SERIA_RETURN;
  }
  return SCENE_GOBLIN_INTRO;
}
