import type { GameState } from '../../core/game-state';
import { CHAPTER_FACT_ID } from '../../knowledge/chapter-1-facts';
import { doesPlayerKnowFact } from '../../knowledge/knowledge-selectors';
import { QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../locations/location-definitions';
import { worldFlag } from '../locations/location-selectors';
import { timeOfDayFromTotalMinutes } from '../../time/clock-types';

export function luenAtmosphereKey(state: Readonly<GameState>): string {
  if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
    return 'POST_GUARDIAN';
  }
  if (worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED)) {
    return 'AFTER_GOBLIN_CAMP';
  }
  if (worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED) || state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status === QUEST_STATUS.COMPLETED) {
    return 'AFTER_FIRST_QUEST';
  }
  return 'ARRIVAL';
}

export function locationAtmosphere(locationId: string, state: Readonly<GameState>): string | null {
  const key = luenAtmosphereKey(state);
  if (locationId === LOCATION_ID.LUEN_VILLAGE) {
    if (key === 'POST_GUARDIAN') {
      return '광장에서 폐허 이야기가 오간다. 같은 루엔이지만, 공기가 전과는 다르다.';
    }
    if (key === 'AFTER_GOBLIN_CAMP') {
      return '모험가들이 숲 안쪽 이야기를 낮게 나눈다. 야영지가 정리됐다는 소문이 돌고 있다.';
    }
    if (key === 'AFTER_FIRST_QUEST') {
      return '길드 쪽에서 신참이 숲길을 다녀왔다는 말이 들린다. 상점 간판이 더 잘 보인다.';
    }
    return '낮은 지붕과 흙길이 이어진 작은 마을이다. 사람들이 오가며 오늘의 소문을 나눈다.';
  }
  if (locationId === LOCATION_ID.BLUE_MOON_INN) {
    if (key === 'POST_GUARDIAN') {
      return '여관 안이 조용하다. 마르타는 당신이 돌아온 것을 이미 눈치챈 듯하다.';
    }
    if (key === 'AFTER_FIRST_QUEST') {
      return '따뜻한 화롯불 사이로, 숲길 소문이 한결 잦아든 이야기가 섞인다.';
    }
    return '따뜻한 화롯불과 보리 향이 퍼지는 여관이다. 여행자와 소문이 모이는 곳이다.';
  }
  if (locationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD) {
    if (worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE)) {
      return '길드홀에 당신의 이름이 적혀 있다. 신입이 더는 아니다.';
    }
    if (worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
      return '칠판에 작은 의뢰와 현상 쪽지가 붙어 있다. 도란이 신입을 지켜본다.';
    }
    return '낡은 나무 간판 아래, 신입 모험가를 받아 적는 작은 길드홀이다.';
  }
  if (locationId === LOCATION_ID.LUEN_GENERAL_STORE) {
    if (key === 'AFTER_GOBLIN_CAMP' || key === 'POST_GUARDIAN') {
      return '엘린이 폐허 쪽에 쓸 물건을 따로 챙겨 두었다. 처음 왔을 때보다 선반이 조금 다르다.';
    }
    if (key === 'AFTER_FIRST_QUEST') {
      return '잡화점에 쓸 만한 검과 갑옷이 나와 있다. 아직 비싼 것도 있다.';
    }
    return '약과 붕대, 작은 도구가 놓인 가게다. 큰 장비는 아직 보이지 않는다.';
  }
  if (locationId === LOCATION_ID.FOREST_ROAD) {
    if (worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_CLEARED)) {
      return '숲길이 조금 조용하다. 그래도 폐허 쪽으로 이어지는 발자국은 남아 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED)) {
      return '정찰대가 지나간 자리는 잠잠하다. 안쪽은 아직 모른다.';
    }
    return '나뭇가지가 길을 덮고, 멀리서 짧은 기척이 난다. 숲길이 안전하지 않다.';
  }
  if (locationId === LOCATION_ID.ANCIENT_RUINS) {
    if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
      return '수호자가 쓰러진 뒤, 더 깊은 길이 열려 있다. 봉인의 잔광이 희미하다.';
    }
    if (worldFlag(state, WORLD_FLAG.RUINS_GATE_CLEARED) || worldFlag(state, WORLD_FLAG.RUINS_GOBLINS_DEFEATED)) {
      return '입구의 기척은 잦아들었지만, 안쪽 제단은 아직 잠들지 않았다.';
    }
    return '허물어진 석조 사이로 바람이 지난다. 안쪽에서 고블린들의 기척이 들린다.';
  }
  return null;
}

export function worldLoreHint(state: Readonly<GameState>): string | null {
  if (worldFlag(state, WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN)) {
    return '북문 너머 초소와, 더 먼 왕도의 그림자가 이야기 속에만 있다.';
  }
  if (doesPlayerKnowFact(state, CHAPTER_FACT_ID.RUMOR_NORTHERN_TRADE)) {
    return '동쪽 길로 오던 상단이 늦는다는 말이 있다. 왕도 쪽 물건이다.';
  }
  return null;
}

export function timeGreeting(state: Readonly<GameState>): string {
  const tod = timeOfDayFromTotalMinutes(state.world.totalMinutes ?? 0);
  if (tod === 'MORNING') {
    return '아침';
  }
  if (tod === 'EVENING' || tod === 'NIGHT') {
    return '저녁';
  }
  return '낮';
}
