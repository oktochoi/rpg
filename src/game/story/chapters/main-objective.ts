import type { GameState } from '../../core/game-state';
import { getQuestDefinition, QUEST_ID } from '../../quests/quest-definitions';
import { currentObjective, featuredQuest } from '../../quests/quest-selectors';
import { QUEST_STATUS } from '../../quests/quest-types';
import { isRuinsKeyHuntActive, playerHasRuinsKey, ruinsKeyHuntStatusLine } from '../../quests/ruins-key-hunt';
import { LOCATION_ID, WORLD_FLAG } from '../../world/locations/location-definitions';
import { worldFlag } from '../../world/locations/location-selectors';
import { CHAPTER_ID } from './chapter-types';
import { currentChapterId, isChapterCompleted } from './chapter-rules';
import { getChapterDefinition } from './chapter-definitions';
import { canChooseFirstAdvancement } from '../../player/classes/first-advancement';

/** Name scene sets the guild flag on enter, before the player has actually given a name. */
function awaitingGuildName(state: Readonly<GameState>): boolean {
  return state.story.currentSceneId === 'luen_guild_register';
}

export function getMainObjectiveText(state: Readonly<GameState>): string {
  const chapterId = currentChapterId(state);
  if (chapterId === CHAPTER_ID.CHAPTER_1_LUEN_RUINS && !isChapterCompleted(state, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)) {
    const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
    const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
    if (!worldFlag(state, WORLD_FLAG.GUILD_REGISTERED) || awaitingGuildName(state)) {
      return '숲길 쪽에 발자국이 남아 있다. 이름은 아직 모험가 길드에 없다.';
    }
    if (forest?.status === QUEST_STATUS.AVAILABLE) {
      return '길드 칠판에 숲길 고블린 의뢰가 붙어 있다.';
    }
    if (forest?.status === QUEST_STATUS.ACTIVE) {
      const definition = getQuestDefinition(forest.id);
      const current = definition ? currentObjective(forest, definition.objectives) : undefined;
      if (current?.id === 'win_scouts') {
        return '숲길에 밀려난 고블린 정찰대가 서 있다.';
      }
      if (current?.id === 'report_doran') {
        if (state.world.currentLocationId === LOCATION_ID.FOREST_ROAD) {
          return '정찰대는 흩어졌다. 길드의 도란이 결과를 기다린다.';
        }
        if (state.world.currentLocationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD) {
          return '도란이 정찰 결과를 듣고 있다.';
        }
        return '모험가 길드의 도란에게 전할 정찰 결과가 있다.';
      }
      return current?.description ?? '첫 정찰이 아직 끝나지 않았다.';
    }
    if (
      canChooseFirstAdvancement(state) &&
      state.world.currentLocationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD
    ) {
      return '도란이 첫 전직을 말할 수 있다. 조사를 이어가도 된다.';
    }
    if (forest?.status === QUEST_STATUS.COMPLETED && (!ruins || ruins.status === QUEST_STATUS.LOCKED)) {
      return '세리아가 폐허 쪽 이야기를 꺼낼 기색이다.';
    }
    if (ruins?.status === QUEST_STATUS.LOCKED || !ruins) {
      return '세리아가 폐허 쪽 이야기를 꺼낼 기색이다.';
    }
    if (ruins.status === QUEST_STATUS.AVAILABLE) {
      if (state.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE) {
        return '세리아가 폐허 조사를 맡기려 한다.';
      }
      return '마을에 세리아가 폐허 조사를 들고 있다.';
    }
    if (ruins.status === QUEST_STATUS.ACTIVE) {
      const definition = getQuestDefinition(ruins.id);
      const current = definition ? currentObjective(ruins, definition.objectives) : undefined;
      if (current?.id === 'find_key' || isRuinsKeyHuntActive(state)) {
        return ruinsKeyHuntStatusLine(state);
      }
      if (current?.id === 'visit_ruins') {
        return '고대 폐허 입구가 앞에 있다.';
      }
      if (current?.id === 'win_mixed') {
        return '폐허 입구를 고블린과 짐승 같은 것들이 막고 있다.';
      }
      if (current?.id === 'investigate_ruins') {
        return '폐허 제단에 왕실 봉인이 남아 있다.';
      }
      if (current?.id === 'win_guardian') {
        return '제단의 수호자가 눈을 떴다.';
      }
      if (current?.id === 'report_seria') {
        return '세리아가 루엔에서 조사 결과를 기다린다.';
      }
      if (current) {
        return current.description;
      }
      if (!worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) && worldFlag(state, WORLD_FLAG.ROYAL_STONE_DISCOVERED)) {
        return '봉인 옆에서 수호자가 깨어나 있다.';
      }
    }
    if (ruins.status === QUEST_STATUS.COMPLETED && !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
      return '고대 폐허의 수호자가 아직 서 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) && !worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED)) {
      return '쓰러진 수호자 옆에 제단이 남아 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED) && !worldFlag(state, WORLD_FLAG.RUINS_ESCAPED)) {
      return '폐허 출구 쪽에 길이 나 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.RUINS_ESCAPED) && !worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN)) {
      return '루엔으로 돌아가는 길이 남아 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN) && !worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT)) {
      return '세리아가 돌아온 당신을 보고 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT) && !worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE)) {
      return '레온과 세리아가 봉인 이야기로 맞서 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE) && !worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE)) {
      return '모험가 길드에 이번 공적을 적어 둘 자리가 있다.';
    }
    if (worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE) && !worldFlag(state, WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN)) {
      return '북문에서 급한 전갈이 기다리고 있다.';
    }
  }

  if (isChapterCompleted(state, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)) {
    if (!worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)) {
      return '제1장이 끝났다. 모험가 길드에서 길을 정할 수 있다.';
    }
    return '길이 정해졌다. 이번 이야기는 여기까지다.';
  }

  if (chapterId === CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW) {
    if (state.world.currentLocationId !== LOCATION_ID.NORTHERN_GATE) {
      return '북문이 다음 길이다.';
    }
    return '레온이 북문 너머의 소문을 알고 있다.';
  }

  const featured = featuredQuest(state);
  const definition = featured ? getQuestDefinition(featured.id) : null;
  const current = featured && definition ? currentObjective(featured, definition.objectives) : undefined;
  if (current) {
    return current.description;
  }
  const chapter = getChapterDefinition(chapterId);
  return chapter?.description ?? '주변을 둘러보세요.';
}

/** One line the player can act on. Shorter than the objective sentence. */
export function getNextStepText(state: Readonly<GameState>): string {
  const here = state.world.currentLocationId;
  const at = (locationId: string) => here === locationId;
  const chapterId = currentChapterId(state);

  if (isChapterCompleted(state, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)) {
    if (!worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)) {
      return at(LOCATION_ID.LUEN_ADVENTURERS_GUILD)
        ? '검사, 마법사, 도적 중 하나를 고른다'
        : '길드에서 검사, 마법사, 도적 중 하나를 고른다';
    }
    return '이번 이야기는 여기까지다';
  }

  if (chapterId !== CHAPTER_ID.CHAPTER_1_LUEN_RUINS) {
    return getMainObjectiveText(state);
  }

  const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];

  if (!worldFlag(state, WORLD_FLAG.GUILD_REGISTERED) || awaitingGuildName(state)) {
    return at(LOCATION_ID.LUEN_ADVENTURERS_GUILD) ? '도란에게 이름을 올린다' : '길드로 가서 이름을 올린다';
  }
  if (forest?.status === QUEST_STATUS.AVAILABLE) {
    return at(LOCATION_ID.LUEN_ADVENTURERS_GUILD) ? '숲 정찰 의뢰를 받는다' : '길드에서 숲 정찰 의뢰를 받는다';
  }
  if (forest?.status === QUEST_STATUS.ACTIVE) {
    const definition = getQuestDefinition(forest.id);
    const current = definition ? currentObjective(forest, definition.objectives) : undefined;
    if (current?.id === 'win_scouts') {
      return at(LOCATION_ID.FOREST_ROAD) ? '고블린 정찰대와 싸운다' : '숲으로 가서 고블린 정찰대와 싸운다';
    }
    if (current?.id === 'report_doran') {
      return at(LOCATION_ID.LUEN_ADVENTURERS_GUILD) ? '도란에게 정찰 결과를 말한다' : '길드의 도란에게 정찰 결과를 말한다';
    }
    return '숲 정찰을 마친다';
  }

  if (ruins?.status === QUEST_STATUS.AVAILABLE || (forest?.status === QUEST_STATUS.COMPLETED && (!ruins || ruins.status === QUEST_STATUS.LOCKED))) {
    return at(LOCATION_ID.LUEN_VILLAGE) ? '세리아에게 폐허 조사를 맡는다' : '마을로 가 세리아에게 폐허 조사를 맡는다';
  }
  if (!ruins || ruins.status === QUEST_STATUS.LOCKED) {
    return at(LOCATION_ID.LUEN_VILLAGE) ? '세리아에게 폐허 조사를 맡는다' : '마을로 가 세리아에게 폐허 조사를 맡는다';
  }

  if (ruins.status === QUEST_STATUS.ACTIVE && (isRuinsKeyHuntActive(state) || !playerHasRuinsKey(state))) {
    if (worldFlag(state, WORLD_FLAG.RUINS_KEY_HOLDER_UNLOCKED)) {
      return at(LOCATION_ID.FOREST_ROAD) ? '열쇠를 가진 고블린을 쓰러뜨린다' : '숲으로 가 열쇠를 가진 고블린을 쓰러뜨린다';
    }
    return at(LOCATION_ID.FOREST_ROAD) ? '고블린을 쓰러뜨려 열쇠를 찾는다' : '숲으로 가 고블린에게서 열쇠를 찾는다';
  }

  if (playerHasRuinsKey(state) && ruins.status === QUEST_STATUS.ACTIVE && !worldFlag(state, WORLD_FLAG.RUINS_GATE_CLEARED)) {
    if (at(LOCATION_ID.ANCIENT_RUINS)) {
      return '입구를 막는 적과 싸운다';
    }
    if (at(LOCATION_ID.FOREST_ROAD)) {
      return '폐허 입구로 들어간다';
    }
    return '숲을 지나 폐허로 간다';
  }

  if (ruins.status === QUEST_STATUS.ACTIVE) {
    const definition = getQuestDefinition(ruins.id);
    const current = definition ? currentObjective(ruins, definition.objectives) : undefined;
    if (current?.id === 'win_mixed') {
      return at(LOCATION_ID.ANCIENT_RUINS) ? '입구를 막는 적과 싸운다' : '폐허 입구로 가 싸운다';
    }
    if (current?.id === 'investigate_ruins') {
      return at(LOCATION_ID.ANCIENT_RUINS) ? '제단을 조사한다' : '폐허 제단을 조사하러 간다';
    }
    if (current?.id === 'win_guardian') {
      return at(LOCATION_ID.ANCIENT_RUINS) ? '수호자와 싸운다' : '폐허로 가 수호자와 싸운다';
    }
    if (current?.id === 'report_seria') {
      return at(LOCATION_ID.LUEN_VILLAGE) ? '세리아에게 조사 결과를 말한다' : '마을로 가 세리아에게 보고한다';
    }
  }

  if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) && !worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED)) {
    return '쓰러진 수호자 옆 제단을 조사한다';
  }
  if (worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED) && !worldFlag(state, WORLD_FLAG.RUINS_ESCAPED)) {
    return '폐허 밖으로 나간다';
  }
  if (worldFlag(state, WORLD_FLAG.RUINS_ESCAPED) && !worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN)) {
    return '마을로 돌아간다';
  }
  if (worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN) && !worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT)) {
    return at(LOCATION_ID.LUEN_VILLAGE) ? '세리아에게 결과를 말한다' : '마을에서 세리아에게 결과를 말한다';
  }
  if (worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT) && !worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE)) {
    return at(LOCATION_ID.NORTHERN_GATE) ? '레온과 이야기를 마친다' : '북문의 레온에게 간다';
  }
  if (worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE) && !worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE)) {
    return at(LOCATION_ID.LUEN_ADVENTURERS_GUILD) ? '도란에게 공적을 남긴다' : '길드에 가서 공적을 남긴다';
  }
  if (worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE) && !worldFlag(state, WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN)) {
    return at(LOCATION_ID.NORTHERN_GATE) ? '북문의 전갈을 확인한다' : '북문으로 가 전갈을 확인한다';
  }

  return '앞에 있는 선택으로 한 걸음 나간다';
}

/** Where the next step is, so the UI can mark one button. */
export interface QuestStepMark {
  /** Hub destination to mark. Null when the step is already at this place. */
  locationId: string | null;
  /** Choice label fragments used only when no choice is already flagged. */
  hints: readonly string[];
}

export function getQuestStepMark(state: Readonly<GameState>): QuestStepMark | null {
  const here = state.world.currentLocationId;
  const go = (locationId: string) => (here === locationId ? null : locationId);
  const chapterId = currentChapterId(state);

  if (isChapterCompleted(state, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)) {
    if (!worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)) {
      return { locationId: go(LOCATION_ID.LUEN_ADVENTURERS_GUILD), hints: ['검사', '마법사', '도적'] };
    }
    return null;
  }
  if (chapterId !== CHAPTER_ID.CHAPTER_1_LUEN_RUINS) {
    return null;
  }

  const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];

  if (!worldFlag(state, WORLD_FLAG.GUILD_REGISTERED) || awaitingGuildName(state)) {
    return { locationId: go(LOCATION_ID.LUEN_ADVENTURERS_GUILD), hints: ['이름을 대', '이름을 올'] };
  }
  if (forest?.status === QUEST_STATUS.AVAILABLE) {
    return { locationId: go(LOCATION_ID.LUEN_ADVENTURERS_GUILD), hints: ['정찰 의뢰', '고블린 의뢰', '의뢰를 맡'] };
  }
  if (forest?.status === QUEST_STATUS.ACTIVE) {
    const definition = getQuestDefinition(forest.id);
    const current = definition ? currentObjective(forest, definition.objectives) : undefined;
    if (current?.id === 'win_scouts') {
      return { locationId: go(LOCATION_ID.FOREST_ROAD), hints: ['정찰대', '기척을 확인'] };
    }
    if (current?.id === 'report_doran') {
      return { locationId: go(LOCATION_ID.LUEN_ADVENTURERS_GUILD), hints: ['정찰 결과', '잔광', '보고한다'] };
    }
    return { locationId: go(LOCATION_ID.FOREST_ROAD), hints: ['정찰'] };
  }

  if (
    ruins?.status === QUEST_STATUS.AVAILABLE ||
    (forest?.status === QUEST_STATUS.COMPLETED && (!ruins || ruins.status === QUEST_STATUS.LOCKED)) ||
    !ruins ||
    ruins.status === QUEST_STATUS.LOCKED
  ) {
    return { locationId: go(LOCATION_ID.LUEN_VILLAGE), hints: ['폐허 조사', '세리아에게'] };
  }

  if (ruins.status === QUEST_STATUS.ACTIVE && (isRuinsKeyHuntActive(state) || !playerHasRuinsKey(state))) {
    return { locationId: go(LOCATION_ID.FOREST_ROAD), hints: ['열쇠'] };
  }

  if (playerHasRuinsKey(state) && ruins.status === QUEST_STATUS.ACTIVE && !worldFlag(state, WORLD_FLAG.RUINS_GATE_CLEARED)) {
    if (here === LOCATION_ID.ANCIENT_RUINS) {
      return { locationId: null, hints: ['입구'] };
    }
    if (here === LOCATION_ID.FOREST_ROAD) {
      return { locationId: null, hints: ['폐허 입구'] };
    }
    return { locationId: LOCATION_ID.FOREST_ROAD, hints: ['폐허 입구', '폐허로'] };
  }

  if (ruins.status === QUEST_STATUS.ACTIVE) {
    const definition = getQuestDefinition(ruins.id);
    const current = definition ? currentObjective(ruins, definition.objectives) : undefined;
    if (current?.id === 'win_mixed' || current?.id === 'investigate_ruins' || current?.id === 'win_guardian') {
      const hints =
        current.id === 'investigate_ruins' ? ['제단'] : current.id === 'win_guardian' ? ['수호자'] : ['입구'];
      return here === LOCATION_ID.ANCIENT_RUINS
        ? { locationId: null, hints }
        : { locationId: LOCATION_ID.FOREST_ROAD, hints };
    }
    if (current?.id === 'report_seria') {
      return { locationId: go(LOCATION_ID.LUEN_VILLAGE), hints: ['조사 결과', '세리아에게'] };
    }
  }

  if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) && !worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED)) {
    return { locationId: go(LOCATION_ID.ANCIENT_RUINS), hints: ['제단'] };
  }
  if (worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED) && !worldFlag(state, WORLD_FLAG.RUINS_ESCAPED)) {
    return { locationId: null, hints: ['밖으로'] };
  }
  if (worldFlag(state, WORLD_FLAG.RUINS_ESCAPED) && !worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN)) {
    return { locationId: go(LOCATION_ID.LUEN_VILLAGE), hints: ['마을로 돌아'] };
  }
  if (worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN) && !worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT)) {
    return { locationId: go(LOCATION_ID.LUEN_VILLAGE), hints: ['세리아에게', '결과를 말'] };
  }
  if (worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT) && !worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE)) {
    return { locationId: go(LOCATION_ID.NORTHERN_GATE), hints: ['레온'] };
  }
  if (worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE) && !worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE)) {
    return { locationId: go(LOCATION_ID.LUEN_ADVENTURERS_GUILD), hints: ['공적'] };
  }
  if (worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE) && !worldFlag(state, WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN)) {
    return { locationId: go(LOCATION_ID.NORTHERN_GATE), hints: ['전갈', '북문'] };
  }

  return null;
}
