import type { ActionType } from '../actions/action-types';
import { LOCATION_ID } from '../world/locations/location-definitions';

export const ACTION_TIME_COST: Readonly<Record<string, number>> = {
  TALK: 10,
  ASK: 10,
  GIVE: 10,
  BRIBE: 15,
  THREATEN: 10,
  INVESTIGATE: 20,
  MOVE: 30,
  HELP: 20,
  RESCUE: 20,
  USE_ITEM: 5,
  WAIT: 60,
  REST: 0,
  ATTACK: 30,
  LEAVE: 10,
  USE_SKILL: 5,
  UNKNOWN: 10,
  STORY_CHOICE: 15,
  QUEST_REPORT: 15,
};

export const COMBAT_TIME_COST = {
  ENCOUNTER: 30,
  BOSS: 50,
} as const;

export const TRAVEL_MINUTES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  [LOCATION_ID.LUEN_VILLAGE]: {
    [LOCATION_ID.BLUE_MOON_INN]: 10,
    [LOCATION_ID.LUEN_ADVENTURERS_GUILD]: 10,
    [LOCATION_ID.LUEN_GENERAL_STORE]: 5,
    [LOCATION_ID.FOREST_ROAD]: 30,
    [LOCATION_ID.NORTHERN_GATE]: 20,
  },
  [LOCATION_ID.BLUE_MOON_INN]: {
    [LOCATION_ID.LUEN_VILLAGE]: 10,
  },
  [LOCATION_ID.LUEN_ADVENTURERS_GUILD]: {
    [LOCATION_ID.LUEN_VILLAGE]: 10,
  },
  [LOCATION_ID.LUEN_GENERAL_STORE]: {
    [LOCATION_ID.LUEN_VILLAGE]: 5,
  },
  [LOCATION_ID.FOREST_ROAD]: {
    [LOCATION_ID.LUEN_VILLAGE]: 30,
    [LOCATION_ID.ANCIENT_RUINS]: 40,
  },
  [LOCATION_ID.ANCIENT_RUINS]: {
    [LOCATION_ID.FOREST_ROAD]: 40,
  },
  [LOCATION_ID.NORTHERN_GATE]: {
    [LOCATION_ID.LUEN_VILLAGE]: 20,
  },
};

export function timeCostForAction(actionType: string): number {
  return ACTION_TIME_COST[actionType] ?? ACTION_TIME_COST.STORY_CHOICE;
}

export function travelMinutesBetween(fromId: string, toId: string): number {
  return TRAVEL_MINUTES[fromId]?.[toId] ?? ACTION_TIME_COST.MOVE;
}

export function isTimedActionType(actionType: string): actionType is ActionType | 'STORY_CHOICE' {
  return actionType in ACTION_TIME_COST;
}
