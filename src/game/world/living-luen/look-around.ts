import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { shopStockPhase, SHOP_STOCK_PHASE } from '../../economy/shop-stock';
import { CHAPTER_FACT_ID } from '../../knowledge/chapter-1-facts';
import { doesPlayerKnowFact } from '../../knowledge/knowledge-selectors';
import { QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { getExplorationPoint, explorationPointsAt } from '../exploration/exploration-definitions';
import { eventsForExplorationPoint, isExplorationPointCompleted } from '../exploration/exploration-service';
import { LOCATION_ID, WORLD_FLAG } from '../locations/location-definitions';
import { worldFlag } from '../locations/location-selectors';
import { locationAtmosphere } from './atmosphere';
import { eventsForMicroEvent, nextLookEvent } from './micro-events';

export interface LookAroundResult {
  narrative: string;
  events: GameEvent[];
}

export function lookAroundResult(state: Readonly<GameState>): LookAroundResult {
  const pendingExplore = explorationPointsAt(state.world.currentLocationId).find(
    (point) => !isExplorationPointCompleted(state, point.id) && getExplorationPoint(point.id)
  );
  if (pendingExplore && !isHubFlavorLocation(state.world.currentLocationId)) {
    const definition = getExplorationPoint(pendingExplore.id);
    if (definition) {
      return { narrative: definition.description, events: eventsForExplorationPoint(state, definition) };
    }
  }

  const micro = nextLookEvent(state);
  if (micro) {
    return {
      narrative: micro.narrative,
      events: eventsForMicroEvent(state, micro),
    };
  }

  return { narrative: fallbackLookNarrative(state), events: [] };
}

function isHubFlavorLocation(locationId: string): boolean {
  return (
    locationId === LOCATION_ID.LUEN_VILLAGE ||
    locationId === LOCATION_ID.BLUE_MOON_INN ||
    locationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD ||
    locationId === LOCATION_ID.LUEN_GENERAL_STORE ||
    locationId === LOCATION_ID.NORTHERN_GATE
  );
}

function fallbackLookNarrative(state: Readonly<GameState>): string {
  const atmosphere = locationAtmosphere(state.world.currentLocationId, state);
  if (state.world.currentLocationId === LOCATION_ID.LUEN_GENERAL_STORE) {
    if (shopStockPhase(state) === SHOP_STOCK_PHASE.C) {
      return '폐허 대비 물건이 눈에 띈다. 엘린이 선반을 다시 정리한 흔적이 있다.';
    }
    if (shopStockPhase(state) === SHOP_STOCK_PHASE.B) {
      return '물약 옆에 검과 갑옷이 놓여 있다. 아직 손대지 않은 좋은 물건도 있다.';
    }
    return '붕대와 물약이 가까이 있다. 큰 장비는 아직 창고에 있는 눈치다.';
  }
  if (state.world.currentLocationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD) {
    const camp = state.quests[QUEST_ID.LEON_GOBLIN_WATCH];
    if (camp?.status === QUEST_STATUS.AVAILABLE || camp?.status === QUEST_STATUS.ACTIVE) {
      return '칠판에 고블린 야영지 관련 쪽지가 붙어 있다.';
    }
    if (state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status === QUEST_STATUS.COMPLETED) {
      return '숲길 정찰 의뢰는 지워져 있다. 다른 작은 부탁만 남아 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
      return '칠판에 신참용 작은 의뢰가 붙어 있다.';
    }
    return '등록 장부와 낡은 무기가 벽에 걸려 있다.';
  }
  if (doesPlayerKnowFact(state, CHAPTER_FACT_ID.SECRET_VILLAGE_ROYAL_MARKER) && state.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE) {
    return '표지석의 문양은 여전히 희미하다. 당장은 더 눈에 띄는 것이 없다.';
  }
  return atmosphere ? `${atmosphere}` : '주변을 천천히 살핀다. 당장은 더 눈에 띄는 것이 없다.';
}
