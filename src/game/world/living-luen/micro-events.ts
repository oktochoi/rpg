import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { eventsForPlayerDiscoveredFact } from '../../knowledge/knowledge-service';
import { CHAPTER_FACT_ID } from '../../knowledge/chapter-1-facts';
import { doesPlayerKnowFact } from '../../knowledge/knowledge-selectors';
import { QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../locations/location-definitions';
import { worldFlag } from '../locations/location-selectors';
import { isExplorationPointCompleted } from '../exploration/exploration-service';
import { shopStockPhase, SHOP_STOCK_PHASE } from '../../economy/shop-stock';
import { luenAtmosphereKey } from './atmosphere';

export interface MicroEventDefinition {
  id: string;
  locationId: string;
  once: boolean;
  narrative: string;
  factId?: string;
  rumor?: boolean;
  conditions: (state: Readonly<GameState>) => boolean;
}

export const MICRO_EVENTS: readonly MicroEventDefinition[] = [
  {
    id: 'square_adventurer_argument',
    locationId: LOCATION_ID.LUEN_VILLAGE,
    once: true,
    narrative: '광장의 두 모험가가 고블린 숫자를 두고 말다툼 중이다. 확실한 수는 아무도 모른다.',
    factId: CHAPTER_FACT_ID.RUMOR_GOBLIN_COUNT_DISPUTE,
    rumor: true,
    conditions: (state) => !worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED),
  },
  {
    id: 'merchant_northern_delay',
    locationId: LOCATION_ID.LUEN_VILLAGE,
    once: true,
    narrative: '상인이 북쪽에서 오던 물건이 늦는다고 불평한다. 왕도 쪽 상단 이야기다. 확실한 이유는 모른다.',
    factId: CHAPTER_FACT_ID.RUMOR_NORTHERN_TRADE,
    rumor: true,
    conditions: () => true,
  },
  {
    id: 'child_blue_light',
    locationId: LOCATION_ID.LUEN_VILLAGE,
    once: true,
    narrative: '아이 하나가 숲에서 푸른 빛을 봤다고 말한다. 어른들은 꿈이라고 한다.',
    factId: CHAPTER_FACT_ID.RUMOR_CHILD_BLUE_LIGHT,
    rumor: true,
    conditions: (state) =>
      worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED) && !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED),
  },
  {
    id: 'guild_wounded_return',
    locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    once: true,
    narrative: '부상당한 모험가가 길드로 돌아온다. 숲 안쪽이 정찰대보다 거칠다고 한다.',
    factId: CHAPTER_FACT_ID.RUMOR_WOUNDED_ADVENTURER,
    rumor: true,
    conditions: (state) => worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED),
  },
  {
    id: 'elin_price_worry',
    locationId: LOCATION_ID.LUEN_GENERAL_STORE,
    once: true,
    narrative: '엘린이 고블린 때문에 물건값이 오를까 걱정한다. 아직은 올리지 않았다.',
    factId: CHAPTER_FACT_ID.RUMOR_ELIN_PRICE_WORRY,
    rumor: true,
    conditions: (state) => shopStockPhase(state) !== SHOP_STOCK_PHASE.C,
  },
  {
    id: 'village_ruins_talk',
    locationId: LOCATION_ID.LUEN_VILLAGE,
    once: true,
    narrative: '폐허에서 뭔가 깨어났다는 이야기가 광장에 퍼져 있다. 자세한 내용은 제각각이다.',
    factId: CHAPTER_FACT_ID.RUMOR_RUINS_STIRRED,
    rumor: true,
    conditions: (state) => worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED),
  },
  {
    id: 'inn_reflection',
    locationId: LOCATION_ID.BLUE_MOON_INN,
    once: true,
    narrative: '여관 손님들이 숲길 이야기를 한다. 들리는 이야기로는 정찰대가 줄었다는 말도 있다.',
    factId: CHAPTER_FACT_ID.RUMOR_FOREST_QUIETER,
    rumor: true,
    conditions: (state) => luenAtmosphereKey(state) === 'AFTER_FIRST_QUEST' || luenAtmosphereKey(state) === 'AFTER_GOBLIN_CAMP',
  },
  {
    id: 'gate_watch_comment',
    locationId: LOCATION_ID.NORTHERN_GATE,
    once: true,
    narrative: '북문 너머 초소 쪽을 살피는 시선이 있다. 문은 아직 열리지 않는다.',
    factId: CHAPTER_FACT_ID.RUMOR_NORTHERN_WATCH,
    rumor: true,
    conditions: (state) => worldFlag(state, WORLD_FLAG.GUILD_REGISTERED),
  },
];

export const SECRET_POINTS: readonly MicroEventDefinition[] = [
  {
    id: 'village_royal_marker',
    locationId: LOCATION_ID.LUEN_VILLAGE,
    once: true,
    narrative: '우물 옆 낡은 표지석에 왕실 문양이 희미하게 남아 있다. 마을 사람들은 장식이라고만 한다.',
    factId: CHAPTER_FACT_ID.SECRET_VILLAGE_ROYAL_MARKER,
    conditions: () => true,
  },
  {
    id: 'forest_strange_metal',
    locationId: LOCATION_ID.FOREST_ROAD,
    once: true,
    narrative: '부러진 화살에 낯선 금속 조각이 박혀 있다. 고블린 것이라기엔 너무 곱다.',
    factId: CHAPTER_FACT_ID.SECRET_FOREST_METAL,
    conditions: (state) => worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED),
  },
  {
    id: 'camp_torn_map',
    locationId: LOCATION_ID.FOREST_ROAD,
    once: true,
    narrative: '야영지 근처에 찢어진 지도 조각이 있다. 폐허 방향이 거칠게 표시되어 있다.',
    factId: CHAPTER_FACT_ID.GOBLIN_MOVEMENT_TRACES,
    conditions: (state) =>
      worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED) ||
      state.quests[QUEST_ID.LEON_GOBLIN_WATCH]?.status === QUEST_STATUS.ACTIVE,
  },
];

export function isMicroEventSeen(state: Readonly<GameState>, eventId: string): boolean {
  return isExplorationPointCompleted(state, eventId) || (state.story.flags?.[eventId] === true);
}

export function nextLookEvent(state: Readonly<GameState>): MicroEventDefinition | null {
  const locationId = state.world.currentLocationId;
  const pool = [...SECRET_POINTS, ...MICRO_EVENTS].filter((event) => event.locationId === locationId);
  return (
    pool.find((event) => {
      if (event.once && isMicroEventSeen(state, event.id)) {
        return false;
      }
      if (event.factId && doesPlayerKnowFact(state, event.factId) && event.once) {
        return false;
      }
      return event.conditions(state);
    }) ?? null
  );
}

export function eventsForMicroEvent(state: Readonly<GameState>, event: MicroEventDefinition): GameEvent[] {
  const outgoing: GameEvent[] = [{ type: 'EXPLORATION_POINT_COMPLETED', pointId: event.id, locationId: event.locationId }];
  if (event.factId && !doesPlayerKnowFact(state, event.factId)) {
    outgoing.push(
      ...eventsForPlayerDiscoveredFact(state, event.factId, event.rumor ? ['story', 'rumor'] : ['story', 'secret'])
    );
  }
  return outgoing;
}
