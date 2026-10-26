import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { canonicalEncounterId, isEncounterCleared } from '../combat/encounters/encounter-progress';
import { ITEM_ID } from '../inventory/item-definitions';
import { playerHasItem } from '../player/player-state';
import { WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { QUEST_ID } from './quest-definitions';
import { QUEST_STATUS } from './quest-types';

/** Base chance per key-hunt encounter clear (one roll per clear). */
export const RUINS_KEY_DROP_CHANCE = 0.2;
/** After this many failed rolls, unlock guaranteed key-holder encounter. */
export const RUINS_KEY_PITY_FAILURES = 5;

/** Mission reward — granted once when the key is acquired. */
export const RUINS_KEY_MISSION_GOLD = 40;
export const RUINS_KEY_MISSION_EXP = 30;

const KEY_HUNT_ENCOUNTERS = new Set<string>([
  ENCOUNTER_ID.CH1_FOREST_SCOUTS,
  ENCOUNTER_ID.FOREST_GOBLIN_01,
  ENCOUNTER_ID.CH1_FOREST_AMBUSH,
  ENCOUNTER_ID.CH1_GOBLIN_CAMP,
  ENCOUNTER_ID.CH1_FOREST_DEEP,
  ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER,
]);

let keyDropRng: () => number = Math.random;

/** Test-only: inject deterministic RNG. Call resetRuinsKeyDropRng after. */
export function setRuinsKeyDropRng(rng: () => number): void {
  keyDropRng = rng;
}

export function resetRuinsKeyDropRng(): void {
  keyDropRng = Math.random;
}

export function isKeyHuntEncounter(combatId: string): boolean {
  return KEY_HUNT_ENCOUNTERS.has(canonicalEncounterId(combatId));
}

export function playerHasRuinsKey(state: Readonly<GameState>): boolean {
  return playerHasItem(state.player, ITEM_ID.RUINS_OLD_KEY) || worldFlag(state, WORLD_FLAG.RUINS_KEY_ACQUIRED);
}

export function isRuinsKeyHuntActive(state: Readonly<GameState>): boolean {
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
  return ruins?.status === QUEST_STATUS.ACTIVE && !playerHasRuinsKey(state);
}

export function ruinsKeyFailedAttempts(state: Readonly<GameState>): number {
  return Math.max(0, state.world.ruinsKeyFailedAttempts ?? 0);
}

/** In-world hint while the key is still missing. Does not name the drop table. */
export function ruinsKeyHuntStatusLine(state: Readonly<GameState>): string {
  if (!isEncounterCleared(state, ENCOUNTER_ID.CH1_FOREST_DEEP)) {
    return '놈들이 계속 안쪽에서 나오고 있어. 우두머리가 뭔가 지키는지도 모르지.';
  }
  if (!isEncounterCleared(state, ENCOUNTER_ID.CH1_GOBLIN_CAMP)) {
    return '야영지 불빛이 아직 꺼지지 않았다. 그 안쪽에서 뭔가 챙기는 기척이 난다.';
  }
  return '우두머리 고블린이 허리춤을 가린 채 물러서지 않는다.';
}

/**
 * Encounter-clear key roll. Uses injectable rng (defaults to Math.random).
 * Does not grant EXP/gold — progression-rules applies the one-shot mission reward.
 */
export function eventsForRuinsKeyHuntOnCombatWon(
  state: Readonly<GameState>,
  combatId: string,
  rng: () => number = keyDropRng
): GameEvent[] {
  if (!isRuinsKeyHuntActive(state) || !isKeyHuntEncounter(combatId)) {
    return [];
  }

  const clearedId = canonicalEncounterId(combatId);
  const isHolder = clearedId === ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER;
  const failures = ruinsKeyFailedAttempts(state);
  const routeCleared =
    isEncounterCleared(state, ENCOUNTER_ID.CH1_FOREST_AMBUSH) &&
    isEncounterCleared(state, ENCOUNTER_ID.CH1_FOREST_DEEP) &&
    isEncounterCleared(state, ENCOUNTER_ID.CH1_GOBLIN_CAMP);
  const authoredGate = new Set<string>([
    ENCOUNTER_ID.CH1_FOREST_SCOUTS,
    ENCOUNTER_ID.FOREST_GOBLIN_01,
    ENCOUNTER_ID.CH1_FOREST_AMBUSH,
    ENCOUNTER_ID.CH1_FOREST_DEEP,
    ENCOUNTER_ID.CH1_GOBLIN_CAMP,
  ]);
  // The three forest stops never drop the key. The key-holder does, once they are done or if fought directly.
  const lateRoll = routeCleared && !authoredGate.has(clearedId) && !isHolder && rng() < RUINS_KEY_DROP_CHANCE;
  const rollSuccess = isHolder || lateRoll;

  if (!rollSuccess) {
    const nextFailures = failures + 1;
    const events: GameEvent[] = [
      { type: 'WORLD_COUNTER_SET', counterId: 'ruinsKeyFailedAttempts', value: nextFailures },
    ];
    if (nextFailures >= RUINS_KEY_PITY_FAILURES && !worldFlag(state, WORLD_FLAG.RUINS_KEY_HOLDER_UNLOCKED)) {
      events.push({ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_KEY_HOLDER_UNLOCKED, value: true });
    }
    return events;
  }

  return eventsForRuinsKeyAcquired(state, `key:drop:${clearedId}`);
}

export function eventsForRuinsKeyAcquired(state: Readonly<GameState>, sourceEventId: string): GameEvent[] {
  if (playerHasRuinsKey(state)) {
    return [];
  }
  return [
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_KEY_ACQUIRED, value: true },
    {
      type: 'ITEM_OBTAINED',
      itemId: ITEM_ID.RUINS_OLD_KEY,
      quantity: 1,
      sourceEventId: `${sourceEventId}:obtained`,
    },
    {
      type: 'HISTORY_RECORDED',
      entry: {
        id: `history_ruins_key_${sourceEventId}`,
        day: state.world.day ?? 1,
        locationId: state.world.currentLocationId,
        summary:
          '★ 중요한 아이템 발견 — 폐허의 낡은 열쇠. 쓰러진 고블린의 허리춤에서 왕실 문양이 새겨진 열쇠를 발견했다.',
        kind: 'DISCOVERY',
      },
    },
  ];
}
