import type { ActionType } from '../../actions/action-types';
import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { applyEvents } from '../../core/reducer';
import { ENCOUNTER_ID } from '../../combat/encounters/encounter-definitions';
import { timeCostForAction, travelMinutesBetween, COMBAT_TIME_COST } from '../../time/action-time-config';
import { dayFromTotalMinutes, nextMorningTotalMinutes } from '../../time/clock-types';
import { eventsForExpGrant, MILESTONE_FACT_EXP } from './progression-rules';
import { ACTION_EXP } from './level-config';

const REPEAT_EXP = 0;

export function repeatKeyFor(state: Readonly<GameState>, actionType: string, targetId?: string): string {
  return `${actionType}:${targetId ?? state.world.currentLocationId}:${state.story.currentSceneId}`;
}

function actionTypeFromEvents(incoming: readonly GameEvent[]): string | null {
  const resolved = [...incoming].reverse().find((event) => event.type === 'ACTION_RESOLVED');
  if (resolved && resolved.type === 'ACTION_RESOLVED') {
    if (!resolved.resolution.success) {
      return null;
    }
    return resolved.resolution.actionType;
  }
  if (incoming.some((event) => event.type === 'LOCATION_ENTERED')) {
    return 'MOVE';
  }
  if (incoming.some((event) => event.type === 'AREA_INVESTIGATED' || event.type === 'EXPLORATION_POINT_COMPLETED')) {
    return 'INVESTIGATE';
  }
  if (incoming.some((event) => event.type === 'DIALOGUE_TURN_RECORDED' || event.type === 'DIALOGUE_STARTED')) {
    return 'TALK';
  }
  if (incoming.some((event) => event.type === 'CHOICE_RESOLVED')) {
    return 'STORY_CHOICE';
  }
  return null;
}

function moveTarget(incoming: readonly GameEvent[]): { fromId: string; toId: string } | null {
  const entered = incoming.find((event) => event.type === 'LOCATION_ENTERED');
  const left = incoming.find((event) => event.type === 'LOCATION_LEFT');
  if (!entered || entered.type !== 'LOCATION_ENTERED') {
    return null;
  }
  return {
    fromId: left && left.type === 'LOCATION_LEFT' ? left.locationId : entered.locationId,
    toId: entered.locationId,
  };
}

function isSmallTalkTurn(incoming: readonly GameEvent[]): boolean {
  return incoming.some(
    (event) => event.type === 'SEMANTIC_ACTION_RECORDED' && event.semanticKey.startsWith('SMALL_TALK:')
  );
}

export function eventsForTurnRewards(state: Readonly<GameState>, incoming: readonly GameEvent[]): GameEvent[] {
  if (incoming.length === 0) {
    return [];
  }
  if (incoming.some((event) => event.type === 'GAME_STARTED' || event.type === 'GAME_LOADED' || event.type === 'TIME_ADVANCED')) {
    return [];
  }
  if (incoming.some((event) => event.type === 'STORY_CONTINUED')) {
    return [];
  }
  if (incoming.some((event) => event.type === 'MENU_OPENED' || event.type === 'MENU_CLOSED' || event.type === 'STAT_POINT_SPENT')) {
    return [];
  }

  const failed = incoming.some(
    (event) => event.type === 'ACTION_RESOLVED' && event.resolution.success === false
  );
  if (failed) {
    return [];
  }

  const combatWon = incoming.find((event) => event.type === 'COMBAT_WON');
  const rest = incoming.some((event) => event.type === 'DAY_ADVANCED' && event.reason === 'REST');
  const actionType = rest ? 'REST' : combatWon ? 'ATTACK' : actionTypeFromEvents(incoming);
  if (!actionType && !combatWon) {
    return [];
  }

  const sourceActionId = `turn-reward:${state.world.turn}:${actionType ?? 'action'}:${combatWon && combatWon.type === 'COMBAT_WON' ? combatWon.combatId : ''}`;
  if ((state.processedTurnRewardIds ?? []).includes(sourceActionId)) {
    return [];
  }

  let minutes = 0;
  if (combatWon && combatWon.type === 'COMBAT_WON') {
    minutes = combatWon.combatId === ENCOUNTER_ID.RUINS_BOSS_01 ? COMBAT_TIME_COST.BOSS : COMBAT_TIME_COST.ENCOUNTER;
  } else if (actionType === 'MOVE') {
    const move = moveTarget(incoming);
    minutes = move ? travelMinutesBetween(move.fromId, move.toId) : timeCostForAction('MOVE');
  } else if (actionType) {
    minutes = timeCostForAction(actionType);
  }

  const previousTotal = state.world.totalMinutes ?? 0;
  const newTotal = previousTotal + Math.max(0, minutes);
  const outgoing: GameEvent[] = [];
  if (minutes > 0) {
    outgoing.push({
      type: 'TIME_ADVANCED',
      minutes,
      reason: combatWon ? 'COMBAT' : actionType === 'MOVE' ? 'MOVE' : 'ACTION',
      sourceActionId,
      previousTotalMinutes: previousTotal,
      newTotalMinutes: newTotal,
    });
    const fromDay = dayFromTotalMinutes(previousTotal);
    const toDay = dayFromTotalMinutes(newTotal);
    if (toDay > fromDay) {
      outgoing.push({ type: 'DAY_ADVANCED', fromDay, toDay, reason: 'STORY' });
    }
  }

  let simulated = applyEvents(state, [...incoming, ...outgoing]);
  const pushExp = (amount: number, id: string, reason: 'ACTION' | 'QUEST' | 'DISCOVERY') => {
    const events = eventsForExpGrant(simulated, amount, id, reason);
    outgoing.push(...events);
    simulated = applyEvents(simulated, events);
  };

  if (!combatWon && actionType && actionType !== 'REST') {
    const target = incoming.find((event) => event.type === 'LOCATION_ENTERED');
    const targetId = target && target.type === 'LOCATION_ENTERED' ? target.locationId : undefined;
    const key = repeatKeyFor(state, actionType, targetId);
    const repeats = state.actionRepeatCounts?.[key] ?? 0;
    const base = ACTION_EXP[actionType as ActionType] ?? ACTION_EXP.STORY_CHOICE;
    const amount =
      actionType === 'WAIT' || isSmallTalkTurn(incoming)
        ? 0
        : repeats === 0
          ? base
          : actionType === 'TALK' || actionType === 'ASK'
            ? 0
            : REPEAT_EXP;
    pushExp(amount, `${sourceActionId}:action`, 'ACTION');
    outgoing.push({ type: 'ACTION_REPEAT_COUNTED', key });
  }

  for (const event of incoming) {
    if (event.type === 'QUEST_OBJECTIVE_COMPLETED') {
      pushExp(ACTION_EXP.QUEST_PROGRESS, `exp:quest-progress:${event.questId}:${event.objectiveId}`, 'QUEST');
    }
    if (event.type === 'LOCATION_DISCOVERED') {
      pushExp(ACTION_EXP.NEW_LOCATION, `exp:new-location:${event.locationId}`, 'DISCOVERY');
    }
    if (event.type === 'PLAYER_LEARNED_FACT') {
      // Milestone facts grant EXP once via progression-rules (exp:milestone:...).
      if (MILESTONE_FACT_EXP[event.factId]) {
        continue;
      }
      const fact = state.world.facts.find((item) => item.id === event.factId);
      const rumor = fact?.tags.includes('rumor') === true || event.factId.includes('rumor');
      if (!rumor) {
        pushExp(ACTION_EXP.NEW_FACT, `exp:new-fact:${event.factId}`, 'DISCOVERY');
      }
    }
  }

  const actionExp = outgoing.filter((event) => event.type === 'PLAYER_EXP_GAINED').reduce((sum, event) => {
    return event.type === 'PLAYER_EXP_GAINED' ? sum + event.amount : sum;
  }, 0);
  outgoing.push({
    type: 'TURN_REWARDS_APPLIED',
    minutes,
    exp: actionExp,
    sourceActionId,
  });
  void nextMorningTotalMinutes;
  return outgoing;
}
