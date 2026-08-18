import type { Choice } from '../../story/choice';
import type { GameState } from '../../core/game-state';
import { CHOICE_ASK_EVENT, CHOICE_ASK_IDENTITY, CHOICE_ASK_RUINS } from '../../npc/talk-choices';
import { QUEST_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from './location-definitions';
import { getCurrentLocationNpcs, worldFlag } from './location-selectors';

export const CHOICE_MOVE_GUILD = 'move_luen_adventurers_guild';
export const CHOICE_MOVE_INN = 'move_blue_moon_inn';
export const CHOICE_MOVE_FOREST = 'move_forest_road';
export const CHOICE_MOVE_VILLAGE = 'move_luen_village';
export const CHOICE_MOVE_RUINS = 'move_ancient_ruins';
export const CHOICE_MOVE_GATE = 'move_northern_gate';
export const CHOICE_MOVE_SHOP = 'move_luen_general_store';
export const CHOICE_OPEN_SHOP = 'open_luen_shop';
export const CHOICE_FIGHT_FOREST_GOBLIN = 'fight_forest_goblin';
export const CHOICE_INVESTIGATE_AREA = 'investigate_area';
export const CHOICE_INVESTIGATE_ALTAR = 'investigate_altar';
export const CHOICE_LOOK_AROUND = 'look_around';
export const CHOICE_TALK_SERIA = 'talk_seria_here';
export const CHOICE_TALK_MARTA = 'talk_marta_here';
export const CHOICE_TALK_LEON = 'talk_leon_here';
export const CHOICE_TALK_DORAN = 'talk_doran_here';
export const CHOICE_REGISTER_GUILD = 'register_adventurer';
export const CHOICE_PASS_GATE = 'pass_northern_gate';
export const CHOICE_REST_INN = 'rest_at_inn';
export const CHOICE_BEGIN_JOURNEY = 'begin_journey';
const CHOICE_ACCEPT_RUINS_MYSTERY = 'accept_ruins_mystery';
const CHOICE_FIGHT_RUINS_MIXED = 'fight_ruins_mixed';
const CHOICE_REPORT_RUINS = 'report_ruins_mystery';
const CHOICE_TALK_RUINS_PROGRESS = 'talk_ruins_progress';

export function locationChoiceDestination(choiceId: string): string | null {
  if (choiceId === CHOICE_MOVE_GUILD) {
    return LOCATION_ID.LUEN_ADVENTURERS_GUILD;
  }
  if (choiceId === CHOICE_MOVE_INN) {
    return LOCATION_ID.BLUE_MOON_INN;
  }
  if (choiceId === CHOICE_MOVE_FOREST) {
    return LOCATION_ID.FOREST_ROAD;
  }
  if (choiceId === CHOICE_MOVE_VILLAGE) {
    return LOCATION_ID.LUEN_VILLAGE;
  }
  if (choiceId === CHOICE_MOVE_RUINS) {
    return LOCATION_ID.ANCIENT_RUINS;
  }
  if (choiceId === CHOICE_MOVE_GATE) {
    return LOCATION_ID.NORTHERN_GATE;
  }
  if (choiceId === CHOICE_MOVE_SHOP) {
    return LOCATION_ID.LUEN_GENERAL_STORE;
  }
  return null;
}

export function storyChoicesForLocation(state: Readonly<GameState>): readonly [Choice, Choice, Choice] {
  const locationId = state.world.currentLocationId;
  const present = new Set(getCurrentLocationNpcs(state).map((npc) => npc.id));
  const quest = state.quests[QUEST_ID.RUINS_MYSTERY];
  const status = quest?.status ?? QUEST_STATUS.LOCKED;

  if (locationId === LOCATION_ID.LUEN_VILLAGE) {
    if (status === QUEST_STATUS.AVAILABLE && present.has('seria')) {
      return [
        { id: CHOICE_ACCEPT_RUINS_MYSTERY, label: '폐허 조사를 맡겠다고 한다' },
        { id: CHOICE_MOVE_INN, label: '여관으로 간다' },
        { id: CHOICE_MOVE_FOREST, label: '숲길로 간다' },
      ];
    }
    if (status === QUEST_STATUS.ACTIVE && present.has('seria')) {
      return [
        { id: CHOICE_TALK_RUINS_PROGRESS, label: '폐허 조사 진행 상황을 이야기한다' },
        { id: CHOICE_MOVE_FOREST, label: '숲길로 간다' },
        { id: CHOICE_MOVE_INN, label: '여관으로 간다' },
      ];
    }
    if (status === QUEST_STATUS.COMPLETED && present.has('seria')) {
      return [
        { id: CHOICE_REPORT_RUINS, label: '조사 결과를 보고한다' },
        { id: CHOICE_MOVE_INN, label: '여관으로 간다' },
        { id: CHOICE_ASK_EVENT, label: '최근 사건을 묻는다' },
      ];
    }
    return [
      { id: CHOICE_MOVE_GUILD, label: '모험가 길드로 간다' },
      { id: CHOICE_MOVE_INN, label: '여관으로 간다' },
      { id: CHOICE_MOVE_SHOP, label: '잡화점에 들른다' },
    ];
  }

  if (locationId === LOCATION_ID.BLUE_MOON_INN) {
    return [
      { id: CHOICE_REST_INN, label: '여관에서 쉰다' },
      present.has('innkeeper')
        ? { id: CHOICE_TALK_MARTA, label: '마르타에게 말을 건다' }
        : { id: CHOICE_LOOK_AROUND, label: '주변을 살핀다' },
      { id: CHOICE_MOVE_VILLAGE, label: '마을로 돌아간다' },
    ];
  }

  if (locationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD) {
    return [
      present.has('guildmaster_doran')
        ? { id: CHOICE_TALK_DORAN, label: '도란과 이야기한다' }
        : { id: CHOICE_LOOK_AROUND, label: '길드 안을 둘러본다' },
      { id: CHOICE_LOOK_AROUND, label: '칠판을 살펴본다' },
      { id: CHOICE_MOVE_VILLAGE, label: '마을로 돌아간다' },
    ];
  }

  if (locationId === LOCATION_ID.LUEN_GENERAL_STORE) {
    return [
      { id: CHOICE_OPEN_SHOP, label: '물건을 살펴본다' },
      { id: CHOICE_MOVE_VILLAGE, label: '마을로 돌아간다' },
      { id: CHOICE_LOOK_AROUND, label: '가게 안을 둘러본다' },
    ];
  }

  if (locationId === LOCATION_ID.FOREST_ROAD) {
    const ruinsKnown = state.world.locations[LOCATION_ID.ANCIENT_RUINS]?.discovered === true;
    const goblinDown = worldFlag(state, WORLD_FLAG.FOREST_GOBLIN_DEFEATED);
    return [
      { id: CHOICE_MOVE_VILLAGE, label: '마을로 돌아간다' },
      ruinsKnown
        ? { id: CHOICE_MOVE_RUINS, label: '폐허로 간다' }
        : { id: CHOICE_INVESTIGATE_AREA, label: '길을 살핀다' },
      goblinDown
        ? { id: CHOICE_LOOK_AROUND, label: '주변을 살핀다' }
        : { id: CHOICE_FIGHT_FOREST_GOBLIN, label: '숲길의 고블린과 싸운다' },
    ];
  }

  if (locationId === LOCATION_ID.ANCIENT_RUINS) {
    const defeated = worldFlag(state, WORLD_FLAG.RUINS_GOBLINS_DEFEATED) || quest?.objectiveProgress.win_mixed?.completed === true;
    return [
      { id: CHOICE_INVESTIGATE_ALTAR, label: '폐허 안쪽을 조사한다' },
      { id: CHOICE_MOVE_FOREST, label: '숲길로 돌아간다' },
      defeated
        ? { id: CHOICE_LOOK_AROUND, label: '주변을 살핀다' }
        : { id: CHOICE_FIGHT_RUINS_MIXED, label: '고블린들에게 접근한다' },
    ];
  }

  if (locationId === LOCATION_ID.NORTHERN_GATE) {
    return [
      { id: CHOICE_MOVE_VILLAGE, label: '마을로 돌아간다' },
      present.has('leon')
        ? { id: CHOICE_TALK_LEON, label: '레온에게 말을 건다' }
        : { id: CHOICE_LOOK_AROUND, label: '주변을 살핀다' },
      { id: CHOICE_PASS_GATE, label: '문을 통과한다' },
    ];
  }

  return [
    { id: CHOICE_ASK_RUINS, label: '폐허에 대해 묻는다' },
    { id: CHOICE_ASK_IDENTITY, label: '당신에 대해 묻는다' },
    { id: CHOICE_LOOK_AROUND, label: '주변을 살핀다' },
  ];
}
